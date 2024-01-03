import _ from 'lodash';
import Fragment from './Fragment.js';
import toLeaves from './toLeaves.js';

/** A single-leaf object, which generates a single path-value pair
 * @param T the "tree" object, the superset for this branch type
 */
type Branch<T extends object> = Fragment<T, unknown>;
export default Branch;

/** Return the path this branch represents along with its leaf */
export function fromBranch<T extends object>(branch: Branch<T>) {
  if (!isBranch(branch))
    throw new Error(
      `Expected a branch of single leaf, received this instead: ${JSON.stringify(
        branch,
      )}`,
    );
  return _.entries(toLeaves(branch))[0];
}

function isBranch(tree: object) {
  // TODO a more efficient way to check
  const leaves = toLeaves<string | undefined>(tree);
  return _.keys(leaves).length === 1;
}
