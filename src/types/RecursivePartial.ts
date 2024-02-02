/* eslint-disable @typescript-eslint/ban-types */

import { ChangeableEntries } from '../changes/Changeable.js';

// CAUTION: do NOT expose this as a package import
// LeafPath<RecursivePartial<T>> will run too many recursive calls
// LeafPath<Fragment<T>> only works because T is explicitly extracted from it

type Entries<T> = {
  [K in keyof T]: readonly [K, T[K]];
};

type NoFunctionKeys<T> = Entries<T>[keyof T] extends infer Entry
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    Entry extends readonly [keyof T, Function]
    ? never
    : Entry extends readonly [keyof T, unknown]
    ? Entry[0]
    : never
  : never;

// Based on https://stackoverflow.com/a/51365037
type RecursivePartial<T> = T extends Function
  ? never
  : T[keyof T] extends ChangeableEntries
  ? never
  : {
      [K in NoFunctionKeys<T>]?: T[K] extends (infer U)[]
        ? RecursivePartial<U>[]
        : T[K] extends object | undefined
        ? RecursivePartial<T[K]>
        : T[K];
    };

export default RecursivePartial;
