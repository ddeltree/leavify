import _ from 'lodash';
import RecursivePartial from './RecursivePartial';
import { Leaf, toLeaves, toTree } from './leavify';
import { get } from './setter';

/** Find the differences between an object and it's modified clone (of same type)
 * @param original imagined as an imutable object,
 * whose properties can be thought of as the "original" ones
 * @param fragment a clone/subset of `original`,
 * imagined as mutable and intended for changes
 * @returns a fragment with only the changed properties
 */
export function findChanges<T>(
  original: T,
  fragment: Fragment<T>,
  compareFn: (original: Leaf, change: Leaf) => boolean = (a, b) => a !== b,
): Fragment<T> {
  const changes: Changes = {};
  _.forEach(toLeaves(fragment), (newValue, path) => {
    const originalValue = get(original, path) as Leaf;
    if (!compareFn(originalValue, newValue)) return;
    changes[path] = {
      change: newValue,
      original: originalValue,
    };
  });
  return toFragment(changes);
}

/** Build the tree from the change record paths */
export function toFragment<T>(
  changes: Changes,
  mapLeaf?: (change: Change) => unknown,
) {
  return toTree<any>(changes, mapLeaf) as Fragment<T>;
}

/** Create Changes object from the leaves of a fragment of T */
export function toChangeSet<T>(
  fragment: Fragment<T>,
  mapLeaf: (value: unknown, path: string) => Change,
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
 * */
export type Fragment<Tree> = Tree extends object
  ? RecursivePartial<Tree>
  : never;

type MappedLeaf<T, Map = T[keyof T]> = {
  [K in keyof T]: T[K] extends (infer U)[]
    ? MappedLeaf<U, Map>[]
    : T[K] extends object | undefined
    ? MappedLeaf<T[K], Map>
    : Map;
};
