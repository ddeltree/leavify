/* eslint-disable @typescript-eslint/no-unused-vars */
import type { HiddenKeys } from './Hidden.js';
import Primitive from './Primitive.js';

export default LeafPath;
type LeafPath<T extends object, HINT extends boolean = false> = ToString<
  Refs<T>,
  null,
  HINT
>;

/** The type of the leaf value sitting at path `P` inside `T`.
 *
 * Omitting `P` yields the union of every leaf type in `T`.
 *
 * @example
 * type Order = { id: string; items: { qty: number }[] };
 * type A = LeafValue<Order, 'id'>;          // string
 * type B = LeafValue<Order, 'items[0].qty'>; // number
 */
export type LeafValue<
  T extends object,
  P extends LeafPath<T> = LeafPath<T>,
> = MatchChain<Refs<T>, P>;

/** Narrows the path space of `T` down to the paths matching `P`.
 *
 * `P` accepts a literal leaf path — autocompleted from `LeafPath<T>` — or a
 * pattern that several paths match, for filtering a whole subtree at once.
 *
 * @example
 * type City = PickLeaves<Order, 'customer.address.city'>;
 * type Editable = PickLeaves<Order, `customer.${string}`>;
 */
export type PickLeaves<
  T extends object,
  P extends LeafPathOrPattern<T>,
> = Extract<LeafPath<T>, P>;

/** Removes `P` from the path space of `T`.
 *
 * Use this for per-field permissions and masking when the field must stay
 * addressable elsewhere. To hide a field everywhere, mark its type with
 * {@link Hidden} instead.
 *
 * `P` accepts a literal leaf path — autocompleted from `LeafPath<T>` — or a
 * pattern that several paths match, for hiding a whole subtree at once.
 *
 * Note that a `P` matching no leaf of `T` removes nothing rather than failing;
 * the pattern half of the constraint cannot tell a typo from a deliberate
 * pattern. Use {@link PickLeaves} when you want a miss to be loud: it yields
 * `never`.
 *
 * @example
 * type Public = OmitLeaves<Order, 'customer.taxId'>;
 * type NoCustomer = OmitLeaves<Order, `customer.${string}`>;
 */
export type OmitLeaves<
  T extends object,
  P extends LeafPathOrPattern<T>,
> = Exclude<LeafPath<T>, P>;

/** A literal leaf path of `T`, or a pattern matching several of them.
 *
 * The `string & {}` half keeps patterns such as `` `customer.${string}` ``
 * assignable while leaving the `LeafPath<T>` half intact, so an editor still
 * offers every leaf path as a completion at this position. A bare `string`
 * constraint would swallow the union and offer nothing.
 */
type LeafPathOrPattern<T extends object> =
  | LeafPath<T>
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

/** Distributes over the union of chains, keeping the ones whose path matches `P`. */
type MatchChain<CHAINS, P extends string> =
  CHAINS extends KeyParentPair[] ?
    P extends ToString<CHAINS> ?
      ChainValue<CHAINS>
    : never
  : never;

/** The value type at the end of a single `[key, parent]` chain. */
type ChainValue<CHAIN extends KeyParentPair[]> =
  CHAIN extends readonly [...infer _, infer LAST] ?
    LAST extends readonly [infer KEY, infer PARENT] ?
      KEY extends keyof PARENT ?
        PARENT[KEY]
      : never
    : never
  : never;

export type Refs<
  T extends object,
  CHAIN extends KeyParentPair[] = [],
  ROOT = T,
  PARENT = T extends infer X ? X : never,
> = {
  [KEY in keyof PARENT]-?: Exclude<PARENT[KEY], undefined> extends infer CHILD ?
    [KEY, PARENT] extends infer PAIR extends KeyParentPair ?
      CHILD extends Primitive ? [...CHAIN, PAIR]
      : CHILD extends readonly unknown[] ? Refs<CHILD, [...CHAIN, PAIR], ROOT>
      : CHILD extends ROOT | PARENT | CHAIN[number][1] ? never
      : Refs<CHILD & object, [...CHAIN, PAIR], ROOT>
    : never
  : never;
}[Exclude<
  PARENT extends readonly unknown[] ? Exclude<keyof PARENT, keyof []>
  : keyof PARENT,
  HiddenKeys<PARENT>
>];

type KeyParentPair = [string | number, object | Primitive];

type ToString<
  PAIRS extends KeyParentPair[],
  PREVIOUS extends KeyParentPair | null = null,
  HINT extends boolean = false,
> =
  PAIRS extends (
    [infer FIRST extends KeyParentPair, ...infer REST extends KeyParentPair[]]
  ) ?
    `${FIRST[1] extends readonly unknown[] ? Arr<FIRST>
    : `${DotNotation<PREVIOUS, FIRST[0], HINT>}`}${ToString<REST, FIRST, HINT>}`
  : PREVIOUS extends KeyParentPair ? ''
  : never;

// Notation string types

/** Bracket notation for one array step.
 *
 * A readonly tuple has literal indices, so `[0]`, `[1]`, … are emitted directly.
 * A mutable array only has `` `[${number}]` ``, for which TypeScript offers no
 * completion at all (microsoft/TypeScript#57545) — the editor would go silent at
 * `roles`. The extra `''` member adds the literal `roles[]` beside it, which the
 * editor can offer; `split()` reads it back as index `0`. It is not spelled `[0]`
 * because an array of unknown length promises no element there.
 */
type Arr<T extends KeyParentPair> =
  Readonly<T[1]> extends T[1] ? `[${T[0]}]` : `[${T[0] | ''}]`;

type DotNotation<
  PREV,
  FIRST extends KeyParentPair[0],
  HINT,
> = `${Dot<PREV, FIRST>}${Prefix<FIRST, HINT>}`;

type Dot<T, U> =
  T extends null ? ''
  : IsIndetermined<U> extends true ? ''
  : '.';

type Prefix<T, HINT> =
  IsIndetermined<T> extends true ?
    T extends string | number ?
      HINT extends true ?
        Prefixes[T]
      : T
    : T
  : T;

type IsIndetermined<T> =
  string extends T ? true
  : number extends T ? true
  : false;

type Prefixes = {
  [K in string | number]: K extends string ?
    // `string` should not intersect with `$`
    '$' | `.${string}`
  : '#' | `.${number}`;
};
