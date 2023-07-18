import _ from 'lodash';
import { Leaf } from './leavify';

/** Returns the leaf value at path on a given object */
export function get(obj: any, path: string): Leaf | null {
  parsePath(path); // throw error if path is invalid
  return has(obj, path) ? _.get(obj, path) : null;
}

/** Checks whether the path refers to a leaf value */
export function has(obj: any, path: string) {
  const value: Leaf | object | symbol = _.get(obj, path);
  switch (typeof value) {
    case 'function':
    case 'symbol':
    case 'object':
      return value === null;
    default:
      return true;
  }
}

/** in-place set value of a deep nested value */
export function set(obj: any, path: string, value: any) {
  const groups = parsePath(path);
  // [a]        => {a: {}}
  // [a, 1, 0]  => {a: [ ___, [ {} ] ]}
  let ref = obj;
  for (const group of groups) {
    const isLastGroup = group === _.last(groups);
    if (group.length === 1) {
      if (isLastGroup) break;
      const key = group[0];
      ref[key] ??= {};
      ref = ref[key];
      continue;
    }
    for (const [i, key] of group.entries()) {
      const isLastKey = i === group.length - 1;
      if (isLastGroup && isLastKey) break;
      ref[key] ??= isLastKey ? {} : [];
      ref = ref[key];
    }
  }
  ref[groups.flat().slice(-1)[0]] = value;
  return obj;
}

function parsePath(path: string) {
  // split by dots or bracket pairs, except when preceded by backslash
  const points = /(?<!\\)\./;
  const brackets = /(?<!\\)\[(.*?)(?<!\\)\]/;
  // a[1][2].b ==> [['a', '1', '2'], ['b']]
  // group keys by whether they refer to directly nested array or object keys
  // --> object key   ==> single-element array, with the key
  // --> arr[][][]... ==> > 2 elements; the last one is an object key
  const groups: string[][] = [];
  for (const sub of path.split(points)) {
    const match = sub.split(brackets);
    // .any.
    if (match.length === 1) {
      groups.push([match[0]]);
      continue;
    }
    // .any[number].
    const keys = match.filter((x) => x); // ignore empty ones (from the brackets)
    if (keys.length === 1 && isNaN(parseInt(keys[0])))
      throw new Error(
        `The notation '.[string].' is not supported
          Use '.string.' instead`,
      );
    else if (keys.slice(1).some((x) => isNaN(parseInt(x))))
      throw new Error(
        `The notation 'array[string]' is not supported, only for numbers.
          Use 'any.string' instead.`,
      );
    groups.push(keys);
  }
  return groups;
}
