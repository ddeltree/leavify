import _ from 'lodash';
import { Leaf, Leaves, toLeaves, toTree } from './treeLeaves.js';
import { get } from './properties.js';
import { Fragment } from './Fragment.js';

/** Find the differences between an object and it's modified clone (of same type)
 * @param original imagined as an imutable object,
 * whose properties can be thought of as the "original" ones
 * @param fragment a clone/subset of `original`,
 * imagined as mutable and intended for making changes to
 * @returns a fragment with only the changed properties
 */
export function findChanges<T>(
  original: T,
  fragment: Fragment<T>,
  options?: {
    compareFn?: (original: Leaf, change: Leaf) => boolean;
  },
): Fragment<T, Leaf> {
  const { compareFn }: Required<NonNullable<typeof options>> = {
    compareFn: (a, b) => a !== b,
    ...options,
  };
  const changes: Leaves = {};
  _.forEach(toLeaves(fragment), (changeValue, path) => {
    // TODO remove type assertion after changing get()'s return type
    const originalValue = get(original, path) as Leaf;
    if (!compareFn(originalValue, changeValue)) return;
    changes[path] = changeValue;
  });
  return toTree<any>(changes) as Fragment<T, Leaf>;
}
