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
  : { path: `${pathAcc}`; value: Primitive<value>; keys: keysAcc };

/** Types an individual path-to-leaf within a given tree.
 * @param T the tree, either a user-defined array or object type or an inferred one.
 * If `T` is inferred from a variable, prefer using `as const` for better accuracy.
 */
export type LeafPath<T> = Leavify<T>['path'];
export type LeafValue<T> = Leavify<T>['value'];

/** A 2-tuple that types the possible path-leaf pairs, individually.
 * @param T the tree, either a user-defined array or object type or an inferred one.
 * If `T` is inferred from a variable, prefer using `as const` for better accuracy.
 */
export type PathLeafPair<T> =
  PathValuePair<T>[keyof PathValuePair<T>] extends infer P
    ? P extends [string, Primitive]
      ? P
      : never
    : never;

// BUG? I have no idea why this works, but...
// `K in keyof U` is the only thing to truly check the existence
// of a specific path-value combination when using `as const`;
export type PathValuePair<T, U extends Leavify<T> = Leavify<T>> = {
  [K in keyof U]: [U['path'], U['value']];
};

/** A 3-tuple that types an individual combination between a path, its value
 * and an array containing the keys of that path.
 * @param T the tree, either a user-defined array or object type or an inferred one.
 * If `T` is inferred from a variable, prefer using `as const` for better accuracy.
 */
export type PathLeafKey<T> = Leavify<T>;

type EntriesOf<T> = {
  [K in keyof T]: [K, T[K]];
};

type Key = {
  name: string;
  isArrayIndex: boolean;
};
