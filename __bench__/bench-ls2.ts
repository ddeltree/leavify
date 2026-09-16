/** Editor-latency benchmark: how long the language service takes to answer
 * "what paths can I write here?" — the headline feature. */
import { resolve } from 'node:path';
import ts from 'typescript';
import { leafPaths, modelSource } from './model.js';

const ROOT = resolve(import.meta.dirname, '..');
const FIXTURE = resolve(ROOT, '__bench__/__cursor__.ts');
const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json')!;
const { options } = ts.parseJsonConfigFileContent(
  ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, ROOT,
);

let source = '';
let version = 0;
const host: ts.LanguageServiceHost = {
  getScriptFileNames: () => [FIXTURE],
  getScriptVersion: () => String(version),
  getScriptSnapshot: (f) =>
    f === FIXTURE ? ts.ScriptSnapshot.fromString(source)
    : ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f) ?? '')
    : undefined,
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

const FIELDS = 4;
const SIZES = [2, 5, 10, 20, 40, 80];
const t00 = performance.now();

// warm the service up so lib.d.ts / project files aren't charged to run #1
completions(`${modelSource('M', 1, 2)}declare const m: M;\nconst s = '${CURSOR}';\n`);

console.log('site,leaves,cold_ms,p50_ms,max_ms,entries');
const sites: Record<string, string> = {
  'CONTROL: plain literal union': `@MODEL@type U = @UNION@;\nconst c: U = '${CURSOR}';\n`,
  'CONTROL: m.g0.|': `@MODEL@declare const m: M;\nconst d = m.g0.${CURSOR};\n`,
};

for (const [site, tpl] of Object.entries(sites)) {
  for (const g of SIZES) {
    const leaves = g * (2 * FIELDS + 2);
    const union = leafPaths(g, FIELDS).map((x) => `'${x}'`).join(' | ');
    const snippet = tpl.replace('@MODEL@', modelSource('M', g, FIELDS)).replace('@UNION@', union);
    const cold = completions(snippet);
    const runs: number[] = [];
    for (let i = 0; i < 5; i++) runs.push(completions(snippet + `// keystroke ${i}\n`).ms);
    runs.sort((a, b) => a - b);
    console.log(
      `"${site}",${leaves},${cold.ms.toFixed(0)},${runs[2].toFixed(0)},${runs[4].toFixed(0)},${cold.n}`,
    );
  }
}
