/* eslint-disable */

import LeafPath from '../types/LeafPath.js';

interface A {
  b: B;
}
interface B {
  c: C;
}
interface C {
  a: A;
  VALOR: 2;
}

// [path, circular reference]
type Cycle = readonly [string, object];
type LeafPair = readonly [string, null];

declare function p<
  const RETURNED extends Cycle | string,
  // Extract information
  const CIRCULAR_PAIRS extends Extract<RETURNED, Cycle> = Extract<
    RETURNED,
    Cycle
  >,
  const CIRCULAR_PATHS extends CIRCULAR_PAIRS extends infer P extends Cycle
    ? P[0]
    : never = CIRCULAR_PAIRS extends infer P extends Cycle ? P[0] : never,
  const LEAF_PATHS extends Extract<RETURNED, string> = Extract<
    RETURNED,
    string
  >,
  const LEAF_PAIRS extends { [P in LEAF_PATHS]: [P, null] }[LEAF_PATHS] = {
    [P in LEAF_PATHS]: [P, null];
  }[LEAF_PATHS],
  const ALL_PATHS extends CIRCULAR_PATHS | LEAF_PATHS =
    | CIRCULAR_PATHS
    | LEAF_PATHS,
  // Map leaf-paths to tuple with null circular ref ( [path, null] )
  const ALL_PAIRS extends CIRCULAR_PAIRS | LEAF_PAIRS =
    | CIRCULAR_PAIRS
    | LEAF_PAIRS,
  const pares extends {
    [P in ALL_PAIRS as P[0]]: P;
  } = {
    [P in ALL_PAIRS as P[0]]: P;
  },
  // Create path
  // const PATH extends PATH_REF_PAIR[0] = PATH_REF_PAIR[0],
  // const REF extends PATH_REF_PAIR[1] = PATH_REF_PAIR[1],
  //
>(
  path: pares[ALL_PATHS] extends infer P extends Cycle | readonly [string, null]
    ? P[1] extends null
      ? P
      : P
    : never,
): RETURNED;
type IsInterp<T extends string> = `${T}-` extends T ? true : false;

// type keys = 'a' | 'b';
// type k = keys extends infer U extends string ? `${U}.` : never;

type a = null extends null ? 'sim' : 'nao';

type RemoveInterpolatorAny<
  T extends string,
  ACC extends string = '',
> = T extends `${infer CHAR}${infer REST}`
  ? REST extends ''
    ? ACC
    : RemoveInterpolatorAny<REST, `${ACC}${CHAR}`>
  : never;

const a: LeafPath<A> = p('');
const b: LeafPath<A> = 'b.c.VALOR';
