import { Primitive } from './Leaves.js';

/** The collection of path-value pairs of a tree.
 * @param T the tree, either a user-defined array or object type or an inferred one.
 * If `T` is inferred from a variable, prefer using `as const` for better accuracy.
 */
export type Leaf<T> = Leavify<T>;
export type Leaves<T> = [Leaf<T>['path'], Leaf<T>['value']][];

type Leavify<
  value,
  pathAcc extends Primitive = undefined,
  keysAcc extends Keys[] = [],
> = value extends readonly any[] // ARRAY
  ? EntriesOf<value>[keyof value] extends infer Entry
    ? Entry extends [Primitive, any]
      ? pathAcc extends undefined
        ? Leavify<
            Entry[1],
            `[${Entry[0]}]`,
            [...keysAcc, { name: `${Entry[0]}`; isArrayIndex: true }]
          >
        : Leavify<
            Entry[1],
            `${pathAcc}[${Entry[0]}]`,
            [...keysAcc, { name: `${Entry[0]}`; isArrayIndex: true }]
          >
      : never
    : never
  : value extends object | undefined // OBJECT
  ? EntriesOf<value>[keyof value] extends infer Entry
    ? Entry extends [Primitive, any]
      ? pathAcc extends undefined
        ? Leavify<
            Entry[1],
            Entry[0],
            [...keysAcc, { name: `${Entry[0]}`; isArrayIndex: false }]
          >
        : Leavify<
            Entry[1],
            `${pathAcc}.${Entry[0]}`,
            [...keysAcc, { name: `${Entry[0]}`; isArrayIndex: false }]
          >
      : never
    : never
  : { path: `${pathAcc}`; value: value; keys: keysAcc };

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

type Keys = {
  name: string;
  isArrayIndex: boolean;
};
