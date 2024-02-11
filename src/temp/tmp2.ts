/* eslint-disable */

import LeafPath from '../types/LeafPath.js';
import { Primitive } from '../types/Leaves.js';

type Arr = [string | number, object | Primitive] | '...';

type Refs<T, ACC extends Arr[] = []> = {
  [K in keyof T]-?: [K, T] extends infer P extends Arr
    ? P extends ACC[number]
      ? [...ACC, P, '...']
      : T[K] extends Primitive
      ? [...ACC, P]
      : Refs<T[K], [...ACC, P]>
    : never;
}[keyof T];

// type Steps<T> = Refs<T> extends [infer FIRST, ...infer REST extends Arr[]]
//   ? [FIRST, Steps<REST>]
//   : never;

type Zip<T> = T extends [infer FIRST, ...infer REST]
  ? REST extends []
    ? [FIRST]
    : [FIRST, ...Zip<REST>]
  : never;

type g = Refs<A>;
type test = Refs<A>;

interface A {
  b: B;
}
interface B {
  c: C;
}
interface C {
  d: D;
  a: A;
  VALOR_1: 2;
}
interface D {
  VALOR_2: 42;
}

interface X {
  y: Y;
}
interface Y {
  z: Z;
}
interface Z {
  data: 2;
}
