import _ from 'lodash';
import RecursivePartial from './RecursivePartial';
import { Leaf, toLeaves, toTree } from './leavify';
import { get } from './setter';

export function compareChanged<T>(
  original: T,
  fragment: Fragment<T>,
  compareFn: (original: Leaf, change: Leaf) => boolean = (a, b) => a !== b,
) {
  const changes: Changes = {};
  _.forEach(toLeaves(fragment), (newValue, path) => {
    const originalValue = get(original, path);
    if (!compareFn(originalValue, newValue)) return;
    changes[path] = {
      change: newValue,
      original: originalValue,
    };
  });
  return changes;
}

/** Create Changes object from the leaves of a fragment of T */
export function fromFragment<T>(
  fragment: Fragment<T>,
  mapLeaf: (value: unknown, path: string) => Change,
) {
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

/** Build the tree from the change record paths */
export function toFragment<T>(
  changes: Changes,
  mapLeaf: (value: Change) => unknown,
): Fragment<T> {
  return toTree<any>(changes, mapLeaf);
}

/** Change record of a collection of objects
 * @example
 * CHANGE_ID: {
 *    path: { original, change }
 * }
 * */
export type ChangeSet = { [key: number]: Changes };

/** Changes regarding an individual item */
export type Changes = Record<string, Change>;
type Change = { original: Leaf; change: Leaf };

/** An object which is a subset of another of type T
 * (recursive partial T).
 * */
export type Fragment<Tree> = Tree extends object
  ? RecursivePartial<Tree>
  : never;
