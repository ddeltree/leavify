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
  Refs<T> extends readonly [...infer _, infer LAST extends KeyOfValuePair] ?
    LAST extends readonly [infer KEY, infer VALUE] ?
      KEY extends keyof VALUE ?
        VALUE[KEY]
      : never
    : never
  : never;

export type Refs<T extends object, ACC extends KeyOfValuePair[] = []> =
  T extends infer U ?
    {
      [K in keyof U]-?: Exclude<U[K], undefined> extends infer V ?
        [K, U] extends infer REF extends KeyOfValuePair ?
          V extends (
            Primitive // leaf value
          ) ?
            [...ACC, REF]
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

type KeyOfValuePair = [string | number, object | Primitive];

type ToString<
  REFS extends KeyOfValuePair[],
  PREVIOUS extends KeyOfValuePair | null = null,
  HINT extends boolean = false,
> =
  REFS extends (
    [infer FIRST extends KeyOfValuePair, ...infer REST extends KeyOfValuePair[]]
  ) ?
    `${FIRST[1] extends readonly unknown[] ? Arr<FIRST>
    : `${DotNotation<PREVIOUS, FIRST[0], HINT>}`}${ToString<REST, FIRST, HINT>}`
  : PREVIOUS extends KeyOfValuePair ? ''
  : never;

type ChangeableKeys<T> = {
  [K in keyof T]: T[K] extends ChangeableEntry ? K : never;
}[keyof T];

// Notation string types

type Arr<T extends KeyOfValuePair> =
  Readonly<T[1]> extends T[1] ? `[${T[0]}]` : `[${T[0] | ''}]`;

type DotNotation<
  PREV,
  FIRST extends KeyOfValuePair[0],
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
