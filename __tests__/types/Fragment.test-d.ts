/* eslint-disable */
import LeafPath from '../../src/types/LeafPath.js';
import { expectType } from 'tsd';

declare function check<T extends object, U extends LeafPath<T> = LeafPath<T>>(
  path: U,
): U;

type F = {
  a: {
    b: {
      c: 2;
    };
    z: undefined;
  };
};
expectType<'a.b.c'>(check<F>('a.b.c'));
