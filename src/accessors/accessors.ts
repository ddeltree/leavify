import { Primitive, LeafPath, LeafValue } from '@typings';
import parsePath, { interpretPathHints } from '@utils/parsePath.js';
import { getByPath, last } from '@utils/objects.js';

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
  return getByPath(obj, parsePath(resolved).flat()) as LeafValue<T, P>;
}

/** Check whether the path refers to a leaf value */
export function has<T extends object>(obj: T, path: LeafPath<T>) {
  path = interpretPathHints(path);
  const keys = parsePath(path).flat();
  const parent = getByPath(obj, keys.slice(0, -1));
  if (typeof parent === 'string') return false;
  const value = getByPath(obj, keys);
  if (value === undefined) return false;
  switch (typeof value) {
    case 'function':
    case 'symbol':
    case 'object':
      return value === null;
    default:
      return true;
  }
}

/** Set a leaf value by path in-place: `set(obj, path)(value)`.
 *
 * The value is checked against the type of the leaf at that path. For paths
 * that are only known at runtime, use {@link setUnchecked}.
 *
 * Taking the value in a *second* call is not a style choice. With the path and
 * the value in one argument list, TypeScript has to type the value against
 * `LeafValue<T, P>` while `P` is still the whole of `LeafPath<T>` — the
 * excessively-deep trap, surfacing as editor latency rather than as an error.
 * Completing a path here took 5.2s on an 800-leaf model as a `[path, value]`
 * tuple and 0.8s curried, which is the cost of no value checking at all. Fixing
 * `P` in the first call is what makes the second one cheap. See `__bench__/`.
 */
export function set<T extends object, P extends LeafPath<T>>(obj: T, path: P) {
  return (value: LeafValue<T, P>): T =>
    setUnchecked(obj, [path, value as Primitive]);
}

/** Set a leaf value by path in-place, without checking the path or the value.
 *
 * The escape hatch for entries built at runtime — replaying a stored changeset,
 * assembling a fragment from parsed input. Prefer {@link set} when the path is
 * known statically.
 *
 * This one keeps the `[path, value]` entry and is *not* curried, which is the
 * shape of the entries {@link walkLeaves} yields and {@link toTree} consumes.
 * It costs nothing: with no `LeafValue` in the signature there is no
 * instantiation to defer, and `toTree` calls it once per leaf, where a closure
 * per leaf would be waste. So the two are asymmetric on purpose — `set` takes a
 * path you wrote, `setUnchecked` replays an entry you already have.
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
    const isLastGroup = group === last(groups);
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
