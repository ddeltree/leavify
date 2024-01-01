import _ from 'lodash';
import RecursivePartial from './RecursivePartial/index.js';
import { Leaf, toLeaves, toTree } from './treeLeaves.js';
import { get } from './properties.js';

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
  return toFragment(changes);
}

/** Build the tree from the change record paths */
export function toFragment<T, U = Change>(
  changes: Changes,
  mapLeaf?: (change: Change) => U,
) {
  return toTree<any>(changes, mapLeaf) as Fragment<T, U>;
}

/** Create Changes object from the leaves of a fragment of T */
export function toChangeSet<T>(
  fragment: Fragment<T>,
  mapLeaf: (value: Leaf, path: string) => Change,
): Changes {
  const changes: Changes = _.reduce(
    _.entries(toLeaves(fragment)),
    (acc, [path, value]) => ({
      ...acc,
      [path]: mapLeaf(value, path),
    }),
    {},
  );
  return changes;
}

/** Changes on a forest
 * @example
 * TREE_ID: {
 *    path: { original, change }
 * }
 * */
export type ChangeSet = { [key: number]: Changes };

/** Path record of the changes on a tree */
export type Changes = Record<string, Change>;
export type Change = { original: Leaf; change: Leaf };

/** An object which is a subset of another of type T
 * (recursive partial T).
 * @param TLeaf types a mapped leaf
 * */
type Fragment<T, TLeaf = undefined> = T extends object
  ? Tree<RecursivePartial<T>, TLeaf>
  : never;
// export type Fragment<T> = T extends object ? RecursivePartial<T> : never;

type Tree<T, TLeaf = undefined> = {
  [K in keyof T]: T[K] extends (infer U)[]
    ? Tree<U, TLeaf>[]
    : T[K] extends object | undefined
    ? Tree<T[K], TLeaf>
    : TLeaf extends undefined
    ? T[K]
    : TLeaf;
};
