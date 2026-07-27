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
 * @example
 * type Editable = PickLeaves<Order, `customer.${string}`>;
 */
export type PickLeaves<T extends object, P extends string> = Extract<
  LeafPath<T>,
  P
>;

/** Removes `P` from the path space of `T`.
 *
 * Use this for per-field permissions and masking when the field must stay
 * addressable elsewhere. To hide a field everywhere, mark its type with
 * {@link Hidden} instead.
 *
 * @example
 * type Public = OmitLeaves<Order, 'customer.taxId'>;
 */
export type OmitLeaves<T extends object, P extends string> = Exclude<
  LeafPath<T>,
  P
>;

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
