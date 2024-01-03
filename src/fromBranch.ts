import _ from 'lodash';
import toLeaves from './toLeaves.js';
import Branch from './Branch.js';

/** Return the path this branch represents along with its leaf */

export default function fromBranch<T extends object>(branch: Branch<T>) {
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
