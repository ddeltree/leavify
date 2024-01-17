// TODO? type property

import { Leaf } from './Leaves.js';

/** The collection of path-value pairs of a tree.
 * @param T the tree, either a user-defined array or object type or an inferred one.
 * If `T` is inferred from a variable, prefer using `as const` for better accuracy.
 */
export type Leaves<T> = Leavify<T>;

type Leavify<
  T,
  Acc extends Leaf = undefined,
  props extends Property[] = [],
> = T extends readonly any[] // ARRAY
  ? EntriesOf<T>[keyof T] extends infer Entry
    ? Entry extends [Leaf, any]
      ? Acc extends undefined
        ? Leavify<
            Entry[1],
            `[${Entry[0]}]`,
            [...props, { name: `${Entry[0]}`; isArrayIndex: true }]
          >
        : Leavify<
            Entry[1],
            `${Acc}[${Entry[0]}]`,
            [...props, { name: `${Entry[0]}`; isArrayIndex: true }]
          >
      : never
    : never
  : T extends object | undefined // OBJECT
  ? EntriesOf<T>[keyof T] extends infer Entry
    ? Entry extends [Leaf, any]
      ? Acc extends undefined
        ? Leavify<
            Entry[1],
            Entry[0],
            [...props, { name: `${Entry[0]}`; isArrayIndex: false }]
          >
        : Leavify<
            Entry[1],
            `${Acc}.${Entry[0]}`,
            [...props, { name: `${Entry[0]}`; isArrayIndex: false }]
          >
      : never
    : never
  : [Acc, T, props];

// EntriesOf<T> -> [K in keyof T]: [K, T[K]] loops through all possible ordered pairs
// for the given set of K in T.
// The relationship of K and T[K] persists outsite of EntriesOf<T>.

// KeyOf<T> -> [K]: T[K] would only be a selection of T[K] alone given any K.
// It is like a for-loop of entries: inside they are related, but outside not necessarily.

// So, outside of KeyOf<T>, attempting to get an index/key and its corresponding value
// by using K and KeyOf<T>[K] would generate two unrelated sets, even if they are side by side,
// since typescript cannot logically determine their relationship outside of KeyOf<T>.
// That would result in a cartesian product, instead of an injection
// - each key combined to every value.

type EntriesOf<T> = {
  [K in keyof T]: [K, T[K]];
};

type Property = {
  name: string;
  isArrayIndex: boolean;
};
