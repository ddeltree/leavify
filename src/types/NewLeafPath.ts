/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeableEntries, OriginalEntries } from '../changes/Changeable.js';
import type Fragment from './Fragment.js';
import { type NoFragment } from './Fragment.js';
import { Primitive } from './Leaves.js';

/** [`key`, `value | ref`, `isLeaf | circular_ref`] */
type Ref = readonly [string | number, object | Primitive, boolean | '...'];

type Refs<T, ACC extends readonly Ref[] = []> = T extends infer X
  ? {
      [K in keyof X]-?: [K, X, false] extends infer P extends Ref
        ? P extends ACC[number]
          ? readonly [...ACC, readonly [P[0], P[1], '...']]
          : X[K] extends Primitive
          ? readonly [...ACC, readonly [P[0], P[1], true]]
          : Refs<X[K], readonly [...ACC, P]>
        : never;
    }[Exclude<Exclude<keyof X, keyof []>, ChangeableKeys<X>>]
  : never;

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

type LeafPath<T extends object> = ToString<Refs<NoFragment<T>>>;
export default LeafPath;

type ChangeableKeys<T> = {
  [K in keyof T]: T[K] extends ChangeableEntries ? K : never;
}[keyof T];

// TESTING TYPES
declare function check<T extends object, U extends LeafPath<T> = LeafPath<T>>(
  path: U,
): U;

() => {
  type DistributivePathUnion<
    T extends object,
    U extends Fragment<T> = Fragment<T>,
    // @ts-check
    _UNION extends Refs<T | U> = Refs<T>,
  > = T;

  // @ts-check object not marked `as const` can interpolate indices
  check<typeof ob1>('objects[30].id');
  const ob1 = {
    objects: [
      {
        id: 2,
      },
    ],
    numbers: [1, 2, 3],
  };

  class Test {
    name!: string;
    other!: [string, number];
    get prop() {
      return true;
    }
  }
  check<Test>('other[1]');
  // @ts-expect-error property does
  check<Test>('');

  interface A {
    leaf: 42;
    original: OriginalEntries<{
      b: 2;
    }>;
  }
  check<A>('leaf');
  // @ts-expect-error refuse to provide intellisense for ChangeableEntries
  check<A>('original.b');
};
