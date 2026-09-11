/** Editor-completion harness.
 *
 * `tsd` checks assignability, which is not the same property as "the editor
 * offers the leaf paths here". A constraint of `string` type-checks every call
 * while offering no completion at all, so an assignability suite stays green
 * while autocompletion — the headline feature — is broken.
 *
 * This drives the real TypeScript language service over a virtual file inside
 * the project, so path aliases and compiler options match what a user's editor
 * resolves, and asks it what it would suggest at the cursor.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/** Marks the cursor position inside a snippet. Stripped before compiling. */
export const CURSOR = '◆';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = resolve(ROOT, '__tests__/types/__cursor__.ts');

const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json');
if (configPath === undefined) throw new Error('tsconfig.json not found');
const { options } = ts.parseJsonConfigFileContent(
  ts.readConfigFile(configPath, ts.sys.readFile).config,
  ts.sys,
  ROOT,
);

let source = '';
let version = 0;

const host: ts.LanguageServiceHost = {
  getScriptFileNames: () => [FIXTURE],
  getScriptVersion: () => String(version),
  getScriptSnapshot: (fileName) =>
    fileName === FIXTURE ? ts.ScriptSnapshot.fromString(source)
    : ts.sys.fileExists(fileName) ?
      ts.ScriptSnapshot.fromString(ts.sys.readFile(fileName) ?? '')
    : undefined,
  fileExists: (fileName) => fileName === FIXTURE || ts.sys.fileExists(fileName),
  readFile: (fileName) =>
    fileName === FIXTURE ? source : ts.sys.readFile(fileName),
  getCurrentDirectory: () => ROOT,
  getCompilationSettings: () => options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};

const service = ts.createLanguageService(host, ts.createDocumentRegistry());

function load(snippet: string) {
  const offset = snippet.indexOf(CURSOR);
  source = snippet.replace(CURSOR, '');
  version++;
  return offset;
}

/** The completions an editor would offer at the {@link CURSOR}, sorted. */
export function completionsAt(snippet: string): string[] {
  const offset = load(snippet);
  if (offset < 0) throw new Error(`snippet has no ${CURSOR} cursor marker`);
  const info = service.getCompletionsAtPosition(FIXTURE, offset, {});
  return (info?.entries ?? []).map((entry) => entry.name).sort();
}

/** The type errors in a snippet. The {@link CURSOR} is optional here. */
export function errorsIn(snippet: string): string[] {
  load(snippet);
  return service
    .getSemanticDiagnostics(FIXTURE)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' '));
}
