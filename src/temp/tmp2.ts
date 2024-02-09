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

declare function p<
  const RETURNED extends Cycle | string,
  // Extract information
  const CYCLES extends Extract<RETURNED, Cycle> = Extract<RETURNED, Cycle>,
  const LEAF_PATHS extends Extract<RETURNED, string> = Extract<
    RETURNED,
    string
  >,
  // Map leaf-paths to tuple with null circular ref ( [path, null] )
  const PATH_REF_PAIR extends
    | CYCLES
    | { [P in LEAF_PATHS]: [P, null] }[LEAF_PATHS] =
    | CYCLES
    | { [P in LEAF_PATHS]: [P, null] }[LEAF_PATHS],
  // Create path
  const PATH extends CYCLES[0] = CYCLES[0],
  const REF extends CYCLES[1] = CYCLES[1],
  const SUBPATH extends Extract<LeafPath<REF>, Cycle>[0] = Extract<
    LeafPath<REF>,
    Cycle
  >[0],
  const CLEAN_PATH extends PATH = PATH,
  const EXTENDED_PATH extends `${CLEAN_PATH}.${SUBPATH}` = `${CLEAN_PATH}.${SUBPATH}`,
  const CLEAN_EXTENDED_PATH extends EXTENDED_PATH = EXTENDED_PATH,
>(path: CLEAN_PATH | CLEAN_EXTENDED_PATH): RETURNED;

const a: LeafPath<A> = p('');
const b: LeafPath<A> = 'b.c.VALOR';
