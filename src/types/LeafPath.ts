/* eslint-disable no-restricted-imports */
import type { ChangeableEntry } from '@changes/Changeable.js';
import Primitive from './Primitive.js';

export default LeafPath;
type LeafPath<T extends object, HINT extends boolean = false> = ToString<
  Refs<T>,
  null,
  HINT
>;

export type LeafValue<T extends object> =
  Refs<T> extends readonly (infer REF)[] ?
    REF extends readonly [infer KEY, infer VALUE, infer IS_OVER] ?
      IS_OVER extends true ?
        KEY extends keyof VALUE ?
          VALUE[KEY]
        : never
      : never
    : never
  : never;

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
            : never
          : V extends object ? Refs<V, [...ACC, REF]>
          : never
        : never
      : never;
    }[Exclude<
      U extends readonly unknown[] ? Exclude<keyof U, keyof []> : keyof U,
      ChangeableKeys<U>
    >]
  : never;

/** [`key`, `value | ref`, `isLeaf | circular_ref`] */
type Ref = [string | number, object | Primitive, boolean];

type ToString<
  REFS extends Ref[],
  PREVIOUS extends Ref | null = null,
  HINT extends boolean = false,
> =
  REFS extends [infer FIRST extends Ref, ...infer REST extends Ref[]] ?
    `${FIRST[1] extends readonly unknown[] ? Arr<FIRST>
    : `${DotNotation<PREVIOUS, FIRST[0], HINT>}`}${ToString<REST, FIRST, HINT>}`
  : PREVIOUS extends Ref ? ''
  : never;

type ChangeableKeys<T> = {
  [K in keyof T]: T[K] extends ChangeableEntry ? K : never;
}[keyof T];

// Notation string types

type Arr<T extends Ref> =
  Readonly<T[1]> extends T[1] ? `[${T[0]}]` : `[${T[0] | ''}]`;

type DotNotation<
  PREV,
  FIRST extends Ref[0],
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
