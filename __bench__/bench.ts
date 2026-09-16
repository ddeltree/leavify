import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { leafPaths, modelSource } from './model.js';

const ROOT = resolve(import.meta.dirname, '..');
const FIXTURE = resolve(ROOT, '__bench__/__fixture__.ts');

const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json')!;
const { options } = ts.parseJsonConfigFileContent(
  ts.readConfigFile(configPath, ts.sys.readFile).config,
  ts.sys,
  ROOT,
);
const opts: ts.CompilerOptions = { ...options, noEmit: true, rootDir: undefined, incremental: false, composite: false };

type Run = { ms: number; instantiations: number; types: number; errors: number };

function compile(source: string): Run {
  writeFileSync(FIXTURE, source);
  const t0 = performance.now();
  const program = ts.createProgram([FIXTURE], opts);
  const errors = program.getSemanticDiagnostics(program.getSourceFile(FIXTURE)).length;
  const ms = performance.now() - t0;
  return { ms, instantiations: program.getInstantiationCount(), types: program.getTypeCount(), errors };
}

// ── scenarios ────────────────────────────────────────────────────────────────
const PRELUDE = `import type { LeafPath, LeafValue } from '@typings';\nimport { get } from '@accessors';\n`;

const scenarios: Record<string, (g: number, f: number) => string> = {
  // control: the model exists, leavify is never applied to it
  baseline: (g, f) => `${modelSource('M', g, f)}declare const m: M;\nconst x = m.g0.f0;\nx;\n`,

  // A: resolve the whole path union once
  LeafPath: (g, f) =>
    `${PRELUDE}${modelSource('M', g, f)}type P = LeafPath<M>;\ndeclare const p: P;\np;\n`,

  // B: exhaustive record over every leaf (the label-map / policy-map trick)
  exhaustive: (g, f) => {
    const entries = leafPaths(g, f).map((p) => `  '${p}': 'x',`).join('\n');
    return `${PRELUDE}${modelSource('M', g, f)}const labels = {\n${entries}\n} satisfies Record<LeafPath<M>, string>;\nlabels;\n`;
  },

  // C: 20 typed reads (LeafValue inferred per call site)
  'get()x20': (g, f) => {
    const all = leafPaths(g, f);
    const calls = Array.from({ length: 20 }, (_, i) =>
      `const v${i} = get(m, '${all[(i * 7) % all.length]}');\nv${i};`,
    ).join('\n');
    return `${PRELUDE}${modelSource('M', g, f)}declare const m: M;\n${calls}\n`;
  },

  // D: the quadratic one — path -> path mapping with value-type compatibility
  mapping: (g, f) => {
    const src = modelSource('Src', g, f);
    const dst = modelSource('Dst', g, f);
    const entries = leafPaths(g, f).map((p) => `  '${p}': '${p}',`).join('\n');
    return `${PRELUDE}${src}${dst}
type Mapping<S extends object, D extends object> = {
  [K in LeafPath<D>]: { [J in LeafPath<S>]: LeafValue<S, J> extends LeafValue<D, K> ? J : never }[LeafPath<S>];
};
const map: Mapping<Src, Dst> = {\n${entries}\n};\nmap;\n`;
  },
};

const FIELDS = 4;
const SIZES = [2, 5, 10, 20, 40, 80]; // groups -> leaves = groups * 10

console.log(`scenario,leaves,ms,instantiations,types,errors`);
for (const [name, build] of Object.entries(scenarios)) {
  for (const g of SIZES) {
    const leaves = g * (2 * FIELDS + 2);
    if (name === 'mapping' && leaves > 200) continue; // quadratic; guarded below
    let r: Run;
    try {
      r = compile(build(g, FIELDS));
    } catch (e) {
      console.log(`${name},${leaves},CRASH,,,${(e as Error).message.slice(0, 60)}`);
      continue;
    }
    console.log(`${name},${leaves},${r.ms.toFixed(0)},${r.instantiations},${r.types},${r.errors}`);
  }
}
