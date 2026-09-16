/** Two questions the width benchmark doesn't answer:
 *  1. does nesting DEPTH blow up (Refs recurses per level)?
 *  2. can the path->path mapping lose its quadratic shape? */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { leafPaths, modelSource } from './model.js';

const ROOT = resolve(import.meta.dirname, '..');
const FIXTURE = resolve(ROOT, '__bench__/__fixture__.ts');
const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json')!;
const { options } = ts.parseJsonConfigFileContent(
  ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, ROOT,
);
const opts = { ...options, noEmit: true, rootDir: undefined, incremental: false, composite: false };

function compile(source: string) {
  writeFileSync(FIXTURE, source);
  const t0 = performance.now();
  const program = ts.createProgram([FIXTURE], opts);
  const errs = program.getSemanticDiagnostics(program.getSourceFile(FIXTURE));
  return {
    ms: performance.now() - t0,
    inst: program.getInstantiationCount(),
    errors: errs.length,
    first: errs[0] ? ts.flattenDiagnosticMessageText(errs[0].messageText, ' ').slice(0, 70) : '',
  };
}

const PRELUDE = `import type { LeafPath, LeafValue } from '@typings';\n`;

// ── 1. depth: one chain of `d` nested objects, 4 scalars at the bottom ───────
function deep(d: number) {
  let t = '{ a: string; b: number; c: boolean; e: string }';
  for (let i = 0; i < d; i++) t = `{ lvl${i}: ${t} }`;
  return `interface M ${t}\n`;
}
console.log('# depth (4 leaves, chain of N objects)');
console.log('depth,ms,instantiations,errors,message');
for (const d of [1, 2, 4, 8, 12, 16, 20, 24]) {
  const r = compile(`${PRELUDE}${deep(d)}type P = LeafPath<M>;\ndeclare const p: P;\np;\n`);
  console.log(`${d},${r.ms.toFixed(0)},${r.inst},${r.errors},"${r.first}"`);
}

// ── 2. mapping, take two: per-entry inference instead of paths x paths ──────
// The quadratic version filters every source path against every target path.
// This one infers both paths at each call site, so cost is per entry.
const BUILDER = `
declare function mapper<S extends object, D extends object>(): {
  from<K extends LeafPath<D>, J extends LeafPath<S>>(
    to: K,
    from: LeafValue<S, J> extends LeafValue<D, K> ? J : never,
  ): void;
};
`;
console.log('\n# mapping: quadratic type vs per-entry builder');
console.log('variant,leaves,ms,instantiations,errors,message');
const FIELDS = 4;
for (const g of [2, 5, 10, 20, 40]) {
  const leaves = g * (2 * FIELDS + 2);
  const paths = leafPaths(g, FIELDS);
  const calls = paths.map((p) => `  m.from('${p}', '${p}');`).join('\n');
  const src = `${PRELUDE}${modelSource('Src', g, FIELDS)}${modelSource('Dst', g, FIELDS)}${BUILDER}
const m = mapper<Src, Dst>();
{\n${calls}\n}
`;
  const r = compile(src);
  console.log(`builder,${leaves},${r.ms.toFixed(0)},${r.inst},${r.errors},"${r.first}"`);
}
