/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeableEntry } from '../changes/Changeable.js';
import { Primitive } from './Leaves.js';

/** [`key`, `value | ref`, `isLeaf | circular_ref`] */
type Ref = [string | number, object | Primitive, boolean | '...'];

export type Refs<T extends object, ACC extends Ref[] = []> =
  T extends infer U ?
    {
      [K in keyof U]-?: Exclude<U[K], undefined> extends infer V ?
        [K, U, false] extends infer REF extends Ref ?
          V extends (
            Primitive // leaf value
          ) ?
            [...ACC, [REF[0], REF[1], true]]
          : REF extends (
            ACC[number] // circular reference
          ) ?
            V extends readonly unknown[] ?
              Refs<V, [...ACC, REF]>
            : [...ACC, [REF[0], REF[1], '...']]
          : V extends object ? Refs<V, [...ACC, REF]>
          : never
        : never
      : never;
    }[Exclude<
      U extends readonly unknown[] ? Exclude<keyof U, keyof []> : keyof U,
      ChangeableKeys<U>
    >]
  : never;

type ToString<REFS extends Ref[], PREVIOUS extends Ref | null = null> =
  REFS extends [infer FIRST extends Ref, ...infer REST extends Ref[]] ?
    `${FIRST[1] extends readonly unknown[] ? Arr<FIRST>
    : `${DotNotation<PREVIOUS, FIRST[0]>}`}${ToString<REST, FIRST>}`
  : PREVIOUS extends Ref ?
    PREVIOUS[2] extends '...' ?
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `${any}`
    : ''
  : never;

type ChangeableKeys<T> = {
  [K in keyof T]: T[K] extends ChangeableEntry ? K : never;
}[keyof T];

// Notation string types

type Arr<T extends Ref> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Readonly<T[1]> extends T[1] ? `[${T[0]}]` : `[${T[0] | ''}]`;

type DotNotation<
  PREV,
  FIRST extends Ref[0],
> = `${Dot<PREV, FIRST>}${Prefix<FIRST>}`;

type Dot<T, U> =
  T extends null ? ''
  : IsIndetermined<U> extends true ? ''
  : '.';

type Prefix<T> =
  IsIndetermined<T> extends true ?
    T extends string | number ?
      Prefixes[T]
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

type LeafPath<T extends object> = ToString<Refs<T>>;
export default LeafPath;
