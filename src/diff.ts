import _ from 'lodash';
import { Leaves, toLeaves } from './leavify';
import { get } from './setter';

/**
 * @param compareFn decides whether the values are different
 * @param options.intersect compares only intersection of A & B. If false, compares the union
 * @returns the path of each of the differences */

export function difference<T, U>(
  A: any,
  B: any,
  options?: {
    intersect?: boolean;
    compareFn?: (aValue: T, bValue: U, path: string) => boolean;
  },
): Leaves<[T | null, U | null]> {
  const compareFn = options?.compareFn ?? (() => false);
  const intersect = options?.intersect ?? true;
  const leavesA = toLeaves<T>(A);
  if (_.isEmpty(leavesA) && intersect) return {};
  const leavesB = toLeaves<U>(B);
  if (_.isEmpty(leavesB) && intersect) return {};
  // case (intersect && both non empty) || not intersect
  const pathSet = new Set<string>();
  // it is possible that both Leaves objects have a path with different nesting
  // so you must check that the path exists on both Leaves objects
  const inOther = (path: string, ob: any, leaves?: Leaves<T | U>) =>
    (intersect && _.has(ob, path)) || !intersect;
  Object.keys(leavesA).forEach((k) => inOther(k, B) && pathSet.add(k));
  Object.keys(leavesB).forEach((k) => inOther(k, A) && pathSet.add(k));
  // comparison
  const result: Leaves<[T, U]> = {};
  pathSet.forEach((path) => {
    // use `get` to allow for non-leaf values
    const valueA = get(A, path) as T,
      valueB = get(B, path) as U;
    // NOTE: only one of the values can (might) be object or array
    // because `path` comes from at least one of the Leaves objects
    if (compareFn(valueA, valueB, path) || valueA !== valueB!)
      result[path] = [valueA, valueB];
  });
  return result;
}

const a = {
  t: [
    {
      tt: 'hello',
    },
  ],
  x: 42,
  y: 24,
  z: 13,
};
const b = {
  t: 'hi',
  u: 'world',
  x: 42,
  y: 24,
  z: 13,
};
const diff = difference(a, b, { intersect: false });
console.log(JSON.stringify(diff, null, 2));

// FOREACH (key of Type):
//  IF   (value is array of U)  make it array of partial U
//  ELIF (value is object)      make its entries partial
//  ELSE                        return leaf value
// stackoverflow.com/a/51365037
type RecursivePartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[K] extends object | undefined
    ? RecursivePartial<T[K]>
    : T[K];
};
