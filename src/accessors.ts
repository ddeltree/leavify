import _ from 'lodash';
import { Leaf } from './Leaves.js';
import parsePath from './parsePath.js';

/** Get the leaf value at the given path.
 * Returns an empty object if the value isn't a leaf or it doesn't exist.
 */
export function get(obj: any, path: string): Leaf {
  if (!has(obj, path)) throw new Error('No leaf value found at the given path');
  return _.get(obj, path);
}

/** Checks whether the path refers to a leaf value */
export function has(obj: any, path: string) {
  const parent = _.get(obj, _.toPath(path).slice(0, -1));
  if (typeof parent === 'string') return false;
  const value = _.get(obj, path, new Error());
  if (value instanceof Error) return false;
  switch (typeof value) {
    case 'function':
    case 'symbol':
    case 'object':
      return value === null;
    default:
      return true;
  }
}

/** in-place setter for a deeply nested value */
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
