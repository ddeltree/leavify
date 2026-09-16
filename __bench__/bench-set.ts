/** Why is completing a path inside set() so much slower than inside get()?
 * Four signature shapes, same model, same cursor position. */
import { resolve } from 'node:path';
import ts from 'typescript';
import { modelSource } from './model.js';

const ROOT = resolve(import.meta.dirname, '..');
const FIXTURE = resolve(ROOT, '__bench__/__cursor__.ts');
const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json')!;
const { options } = ts.parseJsonConfigFileContent(
  ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, ROOT,
);
let source = '', version = 0;
const host: ts.LanguageServiceHost = {
  getScriptFileNames: () => [FIXTURE],
  getScriptVersion: () => String(version),
  getScriptSnapshot: (f) =>
    f === FIXTURE ? ts.ScriptSnapshot.fromString(source)
    : ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f) ?? '') : undefined,
  fileExists: (f) => f === FIXTURE || ts.sys.fileExists(f),
  readFile: (f) => (f === FIXTURE ? source : ts.sys.readFile(f)),
  getCurrentDirectory: () => ROOT,
  getCompilationSettings: () => options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};
const service = ts.createLanguageService(host, ts.createDocumentRegistry());
const CURSOR = '◆';
function completions(snippet: string) {
  const offset = snippet.indexOf(CURSOR);
  source = snippet.replace(CURSOR, '');
  version++;
  const t0 = performance.now();
  const info = service.getCompletionsAtPosition(FIXTURE, offset, {});
  return { ms: performance.now() - t0, n: info?.entries.length ?? 0 };
}

const DECLS = `
import type { LeafPath, LeafValue } from '@typings';
declare function setTuple<T extends object, P extends LeafPath<T>>(o: T, e: readonly [P, LeafValue<T, P>]): T;
declare function setArgs<T extends object, P extends LeafPath<T>>(o: T, p: P, v: LeafValue<T, P>): T;
declare function setCurried<T extends object, P extends LeafPath<T>>(o: T, p: P): (v: LeafValue<T, P>) => T;
declare function setPathOnly<T extends object, P extends LeafPath<T>>(o: T, p: P): T;
`;

const variants: Record<string, string> = {
  'tuple  set(o,[p,v])   (was current)': `setTuple(m, ['${CURSOR}', 'x']);`,
  'args   set(o,p,v)': `setArgs(m, '${CURSOR}', 'x');`,
  'curry  set(o,p)(v)   ← current': `setCurried(m, '${CURSOR}')('x');`,
  'floor  set(o,p)  no LeafValue': `setPathOnly(m, '${CURSOR}');`,
};

const FIELDS = 4;
completions(`${DECLS}${modelSource('M', 1, 2)}declare const m: M;\nsetPathOnly(m, '${CURSOR}');\n`);

console.log('variant,leaves,p50_ms,entries');
for (const [name, line] of Object.entries(variants)) {
  for (const g of [10, 20, 40, 80]) {
    const snippet = `${DECLS}${modelSource('M', g, FIELDS)}declare const m: M;\n${line}\n`;
    const runs: number[] = [];
    for (let i = 0; i < 3; i++) runs.push(completions(snippet + `// ${i}\n`).ms);
    runs.sort((a, b) => a - b);
    const n = completions(snippet + '// n\n').n;
    console.log(`"${name}",${g * (2 * FIELDS + 2)},${runs[1].toFixed(0)},${n}`);
  }
}
