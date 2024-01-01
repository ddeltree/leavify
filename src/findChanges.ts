import _ from 'lodash';
import { Leaf, toLeaves, toTree } from './treeLeaves.js';
import { get } from './properties.js';
import { Fragment } from './Fragment.js';

/** Find the differences between an object and it's modified clone (of same type)
 * @param original imagined as an imutable object,
 * whose properties can be thought of as the "original" ones
 * @param fragment a clone/subset of `original`,
 * imagined as mutable and intended for making changes to
 * @returns a fragment with only the changed properties
 */
export function findChanges<T, MappedLeaf = Change>(
  original: T,
  fragment: Fragment<T>,
  options?: {
    compareFn?: (original: Leaf, change: Leaf) => boolean;
    mapLeaf?: (original: Leaf, change: Leaf) => MappedLeaf;
  },
): Fragment<T, MappedLeaf> {
  const { compareFn, mapLeaf }: Required<NonNullable<typeof options>> = {
    compareFn: (a, b) => a !== b,
    mapLeaf: (original, change) => ({ original, change } as any),
    ...options,
  };
  const changes: Changes = {};
  _.forEach(toLeaves(fragment), (changeValue, path) => {
    const originalValue = get(original, path) as Leaf;
    if (!compareFn(originalValue, changeValue)) return;
    changes[path] = mapLeaf(originalValue, changeValue) as any;
  });
  return toTree<any>(changes) as Fragment<T, MappedLeaf>;
}

/** Path record of the changes on a tree */
export type Changes = Record<string, Change>;
export type Change = { original: Leaf; change: Leaf };
