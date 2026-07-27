import _ from 'lodash';
import { Primitive, LeafPath, LeafValue } from '@typings';
import parsePath, { interpretPathHints } from '@utils/parsePath.js';

/** Get the leaf value at the given path.
 *
 * The return type is the type of the leaf sitting at `path`, not a union of
 * every leaf in the object.
 *
 * Throws an error if the value returned isn't a leaf or doesn't exist.
 */
export function get<T extends object, P extends LeafPath<T>>(obj: T, path: P) {
  const resolved = interpretPathHints<T>(path);
  if (!has(obj, resolved))
    throw new Error('No leaf value found at the given path: ' + resolved);
  return _.get(obj, resolved) as LeafValue<T, P>;
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

/** Set a leaf value by path in-place.
 *
 * The value is checked against the type of the leaf at that path. For paths
 * that are only known at runtime, use {@link setUnchecked}.
 */
export function set<T extends object, P extends LeafPath<T>>(
  obj: T,
  entry: readonly [P, LeafValue<T, P>],
): T {
  return setUnchecked(obj, entry as unknown as [string, Primitive]);
}

/** Set a leaf value by path in-place, without checking the path or the value.
 *
 * The escape hatch for entries built at runtime — replaying a stored changeset,
 * assembling a fragment from parsed input. Prefer {@link set} when the path is
 * known statically.
 */
export function setUnchecked<T extends object>(
  obj: T,
  entry: readonly [string, Primitive],
): T {
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
