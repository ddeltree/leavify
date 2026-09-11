import { get, has } from './accessors.js';
import { Fragment, LeafPath, LeafValue } from '@typings';
import walkLeaves from './walkLeaves.js';

/** One difference between two objects: a leaf path plus the value on each side.
 *
 * This is a discriminated union over the path, so narrowing on the path narrows
 * both values to that leaf's type.
 */
export type LeafDiff<T extends object, P extends LeafPath<T> = LeafPath<T>> =
  P extends unknown ?
    readonly [
      path: P,
      before: LeafValue<T, P> | undefined,
      after: LeafValue<T, P>,
    ]
  : never;

/** Compare two objects and yield the leaves by which they differ.
 *
 * @param before the reference object.
 * @param after a modified clone, or a sparse {@link Fragment} of `before`.
 * @yields `[path, before, after]` for every leaf present in `after` whose value
 * differs. A leaf absent from `before` yields `undefined` as its before value.
 *
 * Only leaves reachable in `after` are visited, so removals are not reported —
 * pass a full object on both sides if you need them.
 */
export default function* diff<T extends object>(
  before: T,
  after: T | Fragment<T>,
): Generator<LeafDiff<T>> {
  // Walk it as a `T`: a Fragment is a sparse `T`, and binding the generic to
  // the union instead would ask `LeafEntry` to describe both shapes at once.
  for (const [path, afterValue] of walkLeaves(after as T)) {
    const p = path as LeafPath<T>;
    const beforeValue = has(before, p) ? get(before, p) : undefined;
    if (beforeValue !== afterValue) {
      yield [p, beforeValue, afterValue] as unknown as LeafDiff<T>;
    }
  }
}
