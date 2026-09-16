import { bracketsReg, keyIndicesReg, pointsReg } from './parsePath.js';

/** Match a leaf path against a mask rule.
 *
 * Separate from `parsePath.ts` on purpose: that file is the *parser* of the
 * grammar, and matching is a consumer of it. Keeping them apart leaves one
 * findable home for the rules that only matching has — starting with the `[]`
 * one below.
 *
 * A rule matches either the exact leaf it names, or — when it names a branch —
 * every leaf beneath it. The comparison is structural rather than textual, so
 * `customer` and `customerId` are simply different tokens and there is no
 * segment-boundary check that can be forgotten.
 */
type PathToken =
  | { readonly kind: 'key'; readonly name: string }
  | { readonly kind: 'index'; readonly at: number | 'any' };

export function compileMatcher(patterns: readonly string[]) {
  const compiled = patterns.map((p) => tokenize(p, 'rule'));
  // A raw-string hit is sufficient but NOT necessary — a prefix rule matches
  // leaves it is not equal to. Never drop the token comparison below for it.
  const exact = new Set(patterns);
  return (path: string) => {
    if (exact.has(path)) return true;
    const candidate = tokenize(path, 'leaf');
    return compiled.some((pattern) => matches(candidate, pattern));
  };
}

function matches(candidate: readonly PathToken[], pattern: readonly PathToken[]) {
  if (pattern.length > candidate.length) return false;
  return pattern.every((token, i) => {
    const other = candidate[i];
    if (token.kind !== other.kind) return false;
    if (token.kind === 'key') return token.name === (other as typeof token).name;
    const at = (other as { at: number | 'any' }).at;
    return token.at === 'any' || token.at === at;
  });
}

/** `[]` resolves differently on the two sides, and that is the point.
 *
 * In a **rule** it is the wildcard: `rows[]` stands for the whole family
 * `` `rows[${number}]` ``, which is the family an editor cannot offer as a
 * completion (microsoft/TypeScript#57545) and which `rows[]` was invented to
 * spell. In a **leaf path** it resolves to index 0, exactly as `split()` does,
 * because there a path denotes one element.
 *
 * Collapsing the two would make a mask redact row 0 and leak every other row.
 */
function tokenize(path: string, side: 'rule' | 'leaf'): PathToken[] {
  const tokens: PathToken[] = [];
  for (const segment of path.split(pointsReg)) {
    const { key, indices } = keyIndicesReg.exec(segment)!.groups!;
    // `LeafPath<T, true>` suffixes an index signature with `$` (string keys) or
    // `#` (number keys). A rule can legitimately carry one, and the accessors
    // do not strip it for us — `interpretPathHints` only resolves `[]`.
    const name = side === 'rule' ? key.replace(/[$#]$/, '') : key;
    if (name !== '') tokens.push({ kind: 'key', name: unescape(name) });
    for (const [, digits] of indices?.matchAll(bracketsReg) ?? [])
      tokens.push({
        kind: 'index',
        at:
          digits !== '' ? parseInt(digits)
          : side === 'rule' ? 'any'
          : 0,
      });
  }
  return tokens;
}

/** Undo leavify's escaping layer, which reserves `.`, `[`, `]` and `\`. */
function unescape(key: string) {
  return key.replace(/\\([.[\]\\])/g, '$1');
}
