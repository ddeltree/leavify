import parsePath from '@utils/parsePath.js';
import type { FromPointer, ToPointer } from '@typings';

/** Convert a leaf path into an RFC 6901 JSON Pointer.
 *
 * `'items[0].sku'` becomes `'/items/0/sku'`, which is what RFC 6902 patch
 * libraries (`fast-json-patch`, `generate-json-patch`, …) expect. Leavify sells
 * the types and the ergonomics; they carry the wire format.
 *
 * The pointer is computed at the type level too, so a literal path yields a
 * literal pointer — the paths stay typed all the way to the wire. A path that
 * is not a literal (`` `items[${number}].sku` ``) widens to `string`.
 */
export function toPointer<P extends string>(path: P): ToPointer<P> {
  const tokens = parsePath(path).flat();
  return ('/' +
    tokens.map(unescapeKey).map(escapeToken).join('/')) as ToPointer<P>;
}

/** Convert an RFC 6901 JSON Pointer into a leaf path.
 *
 * `'/items/0/sku'` becomes `'items[0].sku'`. A numeric token is read as an
 * array index, matching leavify's path grammar.
 *
 * Inverse of {@link toPointer} at the type level as well as at runtime.
 *
 * @throws if the pointer is non-empty and does not start with `/`.
 */
export function fromPointer<PTR extends string>(
  pointer: PTR,
): FromPointer<PTR> {
  if (pointer === '') return '' as FromPointer<PTR>;
  if (!pointer.startsWith('/'))
    throw new Error('A JSON Pointer must start with "/": ' + pointer);
  return pointer
    .slice(1)
    .split('/')
    .map(unescapeToken)
    .map((token, i) =>
      isIndex(token) ? `[${token}]`
      : i === 0 ? escapeKey(token)
      : '.' + escapeKey(token),
    )
    .join('') as FromPointer<PTR>;
}

const isIndex = (token: string) => /^\d+$/.test(token);

// RFC 6901: '~' must be encoded first, so that '/' -> '~1' is unambiguous
const escapeToken = (token: string) =>
  token.replaceAll('~', '~0').replaceAll('/', '~1');

const unescapeToken = (token: string) =>
  token.replaceAll('~1', '/').replaceAll('~0', '~');

// leavify's own grammar: these are structural, so a literal one must be escaped.
// '/' is NOT structural here — only RFC 6901 cares about it.
const escapeKey = (key: string) => key.replace(/([\\.[\]])/g, '\\$1');

const unescapeKey = (key: string) => key.replace(/\\([\\.[\]])/g, '$1');
