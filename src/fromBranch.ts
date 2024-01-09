import _ from 'lodash';
import toLeaves, { walkLeaves } from './toLeaves.js';
import Branch from './Branch.js';

/** Return the path this branch represents along with its leaf */

export default function fromBranch<T extends object>(branch: Branch<T>) {
  const iter = walkLeaves(branch);
  const { value, done } = iter.next();
  const isBranch = !done && iter.next().done;
  if (!isBranch)
    throw new Error(
      `Expected a branch of single leaf, received this instead: ${JSON.stringify(
        branch,
      )}`,
    );
  return value;
}
