/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeableEntries, OriginalEntries } from '../changes/Changeable.js';
import { NoFragment } from './Fragment.js';
import { Primitive } from './Leaves.js';

type Ref = readonly [string | number, object | Primitive, boolean | '...'];

type Refs<T, ACC extends readonly Ref[] = []> = {
  [K in keyof T]-?: [K, T, false] extends infer P extends Ref
    ? P extends ACC[number]
      ? readonly [...ACC, readonly [P[0], P[1], '...']]
      : T[K] extends Primitive
      ? readonly [...ACC, readonly [P[0], P[1], true]]
      : Refs<T[K], readonly [...ACC, P]>
    : never;
}[Exclude<keyof T, keyof []>];

type ToString<
  REFS extends readonly Ref[],
  PREVIOUS extends Ref | null = null,
> = REFS extends readonly [
  infer FIRST extends Ref,
  ...infer REST extends readonly Ref[],
]
  ? `${FIRST[1] extends readonly unknown[]
      ? `[${FIRST[0]}]`
      : `${PREVIOUS extends null ? '' : '.'}${FIRST[0]}`}${ToString<
      REST,
      FIRST
    >}`
  : (PREVIOUS & Ref)[2] extends '...'
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
    `${any}`
  : '';

export type NewLeafPath<T extends object> = ToString<Refs<NoFragment<T>>>;

// TESTING TYPES

() => {
  const // @ts-check object not marked `as const` can interpolate indices
    _1: NewLeafPath<typeof ob1> = 'objects[0].id',
    ob1 = {
      objects: [
        {
          id: 2,
        },
      ],
      numbers: [1, 2, 3],
    };

  const _t1: NewLeafPath<Test> = 'other[1]',
    // @ts-expect-error property does
    _t2: NewLeafPath<Test> = '';
  class Test {
    name!: string;
    other!: [string, number];
    get prop() {
      return true;
    }
  }

  interface A {
    original: OriginalEntries<{
      b: 2;
    }>;
  }
  // @ts-expect-error refuse to provide intellisense for ChangeableEntries
  const b: NewLeafPath<A> = 'original.b';
};
