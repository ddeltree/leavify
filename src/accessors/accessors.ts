import _ from 'lodash';
import { Primitive, LeafPath } from '@typings';
import parsePath, { interpretPathHints } from '@utils/parsePath.js';
import { LeafValue } from '@typings/LeafPath';

/** Get the leaf value at the given path.
 * Throws an error if the value returned isn't a leaf or doesn't exist.
 */
export function get<T extends object>(obj: T, path: LeafPath<T>) {
  path = interpretPathHints(path);
  if (!has(obj, path))
    throw new Error('No leaf value found at the given path: ' + path);
  return _.get(obj, path) as LeafValue<T>;
}

/** Check whether the path refers to a leaf value */
export function has<T extends object>(obj: T, path: LeafPath<T>) {
  path = interpretPathHints(path);
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

/** Set a leaf value by path in-place. */
export function set<T extends object>(
  obj: T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  entry: readonly [(string & {}) | LeafPath<T>, Primitive],
) {
  const [path, value] = entry;
  const groups = parsePath(path);
  // [a]        => {a: {}}
  // [a, 1, 0]  => {a: [ ___, [ {} ] ]}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
