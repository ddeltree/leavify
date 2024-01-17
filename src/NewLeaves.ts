import { Primitive } from './Leaves.js';

type Leavify<
  value,
  pathAcc extends Primitive = undefined,
  keysAcc extends Key[] = [],
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

/** Types an individual path-to-leaf within a given tree.
 * @param T the tree, either a user-defined array or object type or an inferred one.
 * If `T` is inferred from a variable, prefer using `as const` for better accuracy.
 */
export type LeafPath<T> = Leavify<T>['path'];

/** A 2-tuple that types the possible path-leaf pairs, individually.
 * @param T the tree, either a user-defined array or object type or an inferred one.
 * If `T` is inferred from a variable, prefer using `as const` for better accuracy.
 */
export type PathLeafPair<T> = Pair<T>[keyof Pair<T>] extends infer P
  ? P extends [Primitive, Primitive]
    ? P
    : never
  : never;

/** A 3-tuple that types an individual combination between a path, its value
 * and an array containing the keys of that path.
 * @param T the tree, either a user-defined array or object type or an inferred one.
 * If `T` is inferred from a variable, prefer using `as const` for better accuracy.
 */
export type PathLeafKey<T> = Leavify<T>;

type Pair<T, U extends Leavify<T> = Leavify<T>> = {
  [K in keyof U]: [U['path'], U['value']];
};

type EntriesOf<T> = {
  [K in keyof T]: [K, T[K]];
};

type Key = {
  name: string;
  isArrayIndex: boolean;
};
