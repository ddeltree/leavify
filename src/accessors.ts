import _ from 'lodash';
import { Primitive } from './Leaves.js';
import parsePath from './parsePath.js';
import {
  LeafPath,
  LeafValue,
  PathLeafKey,
  PathLeafPair,
  PathValuePair,
} from './NewLeaves.js';

/** Get the leaf value at the given path.
 * Throws an error if the value returned isn't a leaf or doesn't exist.
 */
export function get<T extends object, P extends PathLeafPair<T>>(
  obj: T,
  path: P[0],
) {
  if (!has<T, P>(obj, path))
    throw new Error('No leaf value found at the given path');
  return _.get(obj, path);
}

/** Checks whether the path refers to a leaf value */
export function has<T extends object, P extends PathLeafPair<T>>(
  obj: T,
  path: P[0],
) {
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
export function set<T extends object>(
  obj: T,
  path: LeafPath<T>,
  value: Primitive,
) {
  const groups = parsePath(path);
  // [a]        => {a: {}}
  // [a, 1, 0]  => {a: [ ___, [ {} ] ]}
  let ref: any = obj;
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
