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

type LastKey<T extends string> = T extends `${string}.${infer rest}`
  ? LastKey<rest>
  : T;

declare function p<
  const VALUE extends string | object,
  const PATH extends Extract<VALUE, string> = Extract<VALUE, string>,
  const REF extends Extract<VALUE, object> = Extract<VALUE, object>,
  const SUBPATH extends Extract<LeafPath<REF>, string> = Extract<
    LeafPath<REF>,
    string
  >,
  const CLEAN_PATH extends RemoveInterpolator<PATH> = RemoveInterpolator<PATH>,
  const EXTENDED_PATH extends `${CLEAN_PATH}.${SUBPATH}` = `${CLEAN_PATH}.${SUBPATH}`,
  const CLEAN_EXTENDED_PATH extends RemoveInterpolator<EXTENDED_PATH> = RemoveInterpolator<EXTENDED_PATH>,
>(path: CLEAN_PATH | CLEAN_EXTENDED_PATH): VALUE;

// won't work as is for union of circular + non circular strings
// type RemoveInterpolatorAny<
//   T extends string,
//   ACC extends string = '',
// > = T extends `${infer CHAR}${infer REST}`
//   ? REST extends ''
//     ? ACC
//     : RemoveInterpolatorAny<REST, `${ACC}${CHAR}`>
//   : never;
type RemoveInterpolator<T> = T;

const a: LeafPath<A> = p('b.c.a');
