/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Refs<T> extends readonly [...infer _, infer LAST] ?
    LAST extends readonly [infer KEY, infer VALUE] ?
      KEY extends keyof VALUE ?
        VALUE[KEY]
      : never
    : never
  : never;

export type Refs<
  T extends object,
  CHAIN extends KeyParentPair[] = [],
  ROOT = T extends infer X ? X : never,
  PARENT = T extends infer X ? X : never,
> = {
  [KEY in keyof PARENT]-?: Exclude<PARENT[KEY], undefined> extends infer CHILD ?
    [KEY, PARENT] extends infer PAIR extends KeyParentPair ?
      CHILD extends Primitive ? [...CHAIN, PAIR]
      : PAIR extends CHAIN[number] ?
        CHILD extends readonly unknown[] ?
          Refs<CHILD, [...CHAIN, PAIR], ROOT>
        : never // circular reference
      : CHAIN[number] extends readonly [...infer _, infer O] ?
        O extends ROOT ?
          never // circular reference
        : CHILD extends object ? Refs<CHILD, [...CHAIN, PAIR], ROOT>
        : never
      : never
    : never
  : never;
}[Exclude<
  PARENT extends readonly unknown[] ? Exclude<keyof PARENT, keyof []>
  : keyof PARENT,
  ChangeableKeys<PARENT>
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

type ChangeableKeys<T> = {
  [K in keyof T]: T[K] extends ChangeableEntry ? K : never;
}[keyof T];

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
