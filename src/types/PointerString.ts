/** The type-level half of `src/accessors/pointer.ts`.
 *
 * Each type here mirrors one function in that file, step for step, so the two
 * halves can be checked against each other case by case — see
 * `__tests__/accessors/pointer.test.ts`, where one table drives both the
 * runtime assertion and the type assertion.
 *
 * A path that is not a fully literal string still converts as far as the grammar
 * allows: `` `items[${number}].sku` `` yields `` `/items/${number}/sku` ``,
 * because a numeric hole cannot contain a delimiter. A `` `${string}` `` hole
 * can contain anything, delimiters included, so those widen to `string` — true
 * but imprecise, which is the right failure direction. Neither ever resolves to
 * `never`, which would be assignable everywhere and hide the mistake.
 */

/** Structural in leavify's grammar, so a literal one is backslash-escaped. */
type Escapable = '\\' | '.' | '[' | ']';

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/** Digits only — the type-level twin of `/^\d+$/`. `` `${number}` `` is wider
 * than that (it admits `-1`, `1.5`, `1e5`), and the runtime reads those as
 * ordinary keys, so using it here would make the two halves disagree. */
type IsIndex<S extends string> =
  // a token of unknown content could be anything, so it is not an index
  string extends S ? false
  : // a numeric hole always is one: every value it stands for is digits
  `${number}` extends S ? true
  : S extends `${Digit}${infer REST}` ?
    REST extends '' ?
      true
    : IsIndex<REST>
  : false;

type ReplaceAll<S extends string, FROM extends string, TO extends string> =
  S extends `${infer A}${FROM}${infer B}` ?
    `${A}${TO}${ReplaceAll<B, FROM, TO>}`
  : S;

/** RFC 6901: `~` first, so that `/` → `~1` stays unambiguous. */
type EscapeToken<S extends string> = ReplaceAll<
  ReplaceAll<S, '~', '~0'>,
  '/',
  '~1'
>;

type UnescapeToken<S extends string> = ReplaceAll<
  ReplaceAll<S, '~1', '/'>,
  '~0',
  '~'
>;

/** Backslash-escapes what is structural in a leavify path. `/` is not — only
 * RFC 6901 reserves it. */
type EscapeKey<S extends string> =
  S extends `${infer C}${infer REST}` ?
    C extends Escapable ?
      `\\${C}${EscapeKey<REST>}`
    : `${C}${EscapeKey<REST>}`
  : S;

/** Appends a token, dropping the empty one that a leading `[` or a `[]` group
 * produces. */
type Push<ACC extends string[], TOKEN extends string> =
  TOKEN extends '' ? ACC : [...ACC, TOKEN];

/** Splits a path into its tokens, undoing the leavify escape layer on the way —
 * the type-level twin of `parsePath(path).flat().map(unescapeKey)`. */
type Tokens<
  P extends string,
  CUR extends string = '',
  ACC extends string[] = [],
> =
  // an escaped structural character belongs to the key, and loses its backslash
  P extends `\\${infer C extends Escapable}${infer REST}` ?
    Tokens<REST, `${CUR}${C}`, ACC>
  : P extends `.${infer REST}` ? Tokens<REST, '', Push<ACC, CUR>>
  : // `[]` is shorthand for `[0]`, the same normalisation `split()` applies
  P extends `[${infer IDX}]${infer REST}` ?
    Tokens<REST, '', [...Push<ACC, CUR>, IDX extends '' ? '0' : IDX]>
  : P extends `${infer C}${infer REST}` ? Tokens<REST, `${CUR}${C}`, ACC>
  : Push<ACC, CUR>;

type JoinAsPointer<TOKENS extends string[]> =
  TOKENS extends [infer HEAD extends string, ...infer REST extends string[]] ?
    `/${EscapeToken<HEAD>}${JoinAsPointer<REST>}`
  : '';

type SplitPointer<PTR extends string, ACC extends string[] = []> =
  PTR extends `${infer HEAD}/${infer REST}` ? SplitPointer<REST, [...ACC, HEAD]>
  : [...ACC, PTR];

type JoinAsPath<TOKENS extends string[], FIRST extends boolean = true> =
  TOKENS extends [infer HEAD extends string, ...infer REST extends string[]] ?
    UnescapeToken<HEAD> extends infer TOKEN extends string ?
      `${IsIndex<TOKEN> extends true ? `[${TOKEN}]`
      : FIRST extends true ? EscapeKey<TOKEN>
      : `.${EscapeKey<TOKEN>}`}${JoinAsPath<REST, false>}`
    : never
  : '';

/** Whether `S` is a single literal string, rather than `string` itself or a
 * template carrying a hole. The parsers below only hold for literals. */
type IsLiteral<S extends string> =
  string extends S ? false
  : S extends `${string}${infer REST}` ?
    REST extends '' ?
      true
    : IsLiteral<REST>
  : true;

/** The RFC 6901 JSON Pointer for the leaf path `P`.
 *
 * @example
 * type A = ToPointer<'items[0].sku'>; // '/items/0/sku'
 */
export type ToPointer<P extends string> =
  IsLiteral<P> extends true ? JoinAsPointer<Tokens<P>> : string;

/** The leaf path for the RFC 6901 JSON Pointer `PTR`.
 *
 * @example
 * type A = FromPointer<'/items/0/sku'>; // 'items[0].sku'
 */
export type FromPointer<PTR extends string> =
  IsLiteral<PTR> extends true ?
    PTR extends '' ? ''
    : PTR extends `/${infer REST}` ? JoinAsPath<SplitPointer<REST>>
    : never
  : string;
