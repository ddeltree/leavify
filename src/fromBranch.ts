import _ from 'lodash';
import walkLeaves from './walkLeaves.js';
import Branch from './Branch.js';

/** Return the path this branch represents along with its leaf */

export default function fromBranch<T extends object>(branch: Branch<T>) {
  const iter = walkLeaves(branch);
  const { value, done } = iter.next();
  if (done || !iter.next().done)
    throw new Error(
      `Expected a branch of single leaf, received this instead: ${JSON.stringify(
        branch,
      )}`,
    );
  return value;
}
