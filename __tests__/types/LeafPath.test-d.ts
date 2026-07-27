/* eslint-disable */
import {
  expectError,
  expectNotAssignable,
  expectNotType,
  expectType,
} from 'tsd';
import LeafPath, { Refs } from '@typings/LeafPath.js';
import type { Hidden } from '@typings/Hidden.js';
import Fragment from '@typings/Fragment.js';
import Primitive from '@typings/Primitive.js';

declare function check<
  T extends object,
  HINT extends boolean = false,
  U extends LeafPath<T, HINT> = LeafPath<T, HINT>,
>(path: U): U;

// Inheritance
class X {
  name!: string;
}
interface Y {
  id: number;
}
class Z extends X implements Y {
  id!: number;
}
expectNotType<any>(check<Z>('id'));
expectNotType<any>(check<Z>('name'));

// The paths of the union is the union of the paths of each union element
type DistributivePathUnion<
  T extends object,
  U extends Fragment<T> = Fragment<T>,
  _UNION extends Refs<T | U> = Refs<T> | Refs<U>,
> = T;

// object not marked `as const` can interpolate indices
expectNotType<any>(check<typeof ob1>('objects[30].id'));
const ob1 = {
  objects: [
    {
      id: 2,
    },
  ],
  numbers: [1, 2, 3],
};

// functions are not valid
class Test {
  name!: string;
  other!: [string, number];
  get prop() {
    return true;
  }
  myFunction() {}
}
expectNotType<any>(check<Test>('other[1]'));
expectError(check<Test>('myFunction'));

// A Hidden field is excluded from the path space, so a field holding a nested
// copy of the same shape does not duplicate every path under a new prefix.
type Fragm = {
  leaf: number;
  arr: number[];
  ob1: Record<string, string>;
  ob2: Record<number, string>;
};
interface WithHidden extends Fragm {
  snapshot: Hidden<Fragm>;
}
expectType<LeafPath<Fragm>>(check<Fragm & Hidden<Fragm> & WithHidden>('leaf'));
expectType<LeafPath<Fragm>>(check<WithHidden>('leaf'));
expectError(check<WithHidden>('snapshot.leaf'));

// Hidden hides a plain leaf too
interface User {
  name: string;
  passwordHash: Hidden<string>;
}
expectType<'name'>(check<User>('name'));
expectError(check<User>('passwordHash'));

// Non-as-const array
const obInArr = [1, '2', { id: '123' }],
  arrInOb = {
    leaf: 'value',
    obj: {
      leaf: 'value',
      obj: {} as Record<string, unknown>,
      arr: [] as unknown[],
    },
    arr: ['value', {} as Record<string, unknown>, [] as unknown[]],
    arr2: [1, 2, 3],
  };
expectNotType<`${any}` | `[${number | ''}].id`>(
  check<typeof obInArr>('[0].id'),
);
expectError(check<typeof arrInOb>('obj'));
expectError(check<typeof arrInOb>('obj.obj'));
expectError(check<typeof arrInOb>('obj.arr'));
expectError(check<typeof arrInOb>('arr'));

// Mix of leaves and trees inside array
type LeafTreeArray = (
  | Primitive
  | Record<string, Primitive>
  | Record<number, Primitive>
  | Primitive[]
)[];
type expected =
  | `[${number | ''}]`
  | `[${number | ''}][${number | ''}]`
  | `[${number | ''}].${string | number}`
  | `[${number | ''}]${'$' | '#'}`;
expectType<expected>(check<LeafTreeArray, true>('[1].'));

// empty array or object
type M = ['value', {}, []];
expectType<`[${0 | ''}]`>(check<M>('[0]'));
type N = { leaf: 'value'; list: []; ob: {} };
expectType<'leaf'>(check<N>('leaf'));

// arrays inside objects
type Bug = { values: number[] };
expectType<`values[${number | ''}]`>(check<Bug>('values[0]'));

// Record type inside object
// this can be messed up by the Hidden marker's definition
type Records = {
  strings: Record<string, string>;
  numbers: Record<number, number>;
};
expectType<`strings.${string}` | 'strings$' | 'numbers#' | `numbers.${number}`>(
  check<Records, true>('strings.other'),
);

type FalseCircularReference = (number | (number | number[])[])[];
expectNotType<
  | '[]'
  | `[${number}]`
  | `[${number}][${number}]`
  | `[${number}][]`
  | `[][${number}]`
  | `[][]${any}`
  | `[][${number}]${any}`
  | `[${number}][]${any}`
  | `[${number}][${number}]${any}`
>(check<FalseCircularReference>('[][][]'));

type ll = Refs<FalseCircularReference>;

interface A {
  value_A: 'a';
  B?: B;
}
interface B {
  value_B: 'b';
  A: A;
}
type C = LeafPath<A> extends 'value_A' | 'B.value_B' ? true : never;
expectType<C>(true);
