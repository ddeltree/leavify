import _ from 'lodash';
import Fragment from './Fragment.js';
import toLeaves from './toLeaves.js';

// TODO future check of branch does not need to convert entire tree to leaves
export function getBranchLeaf<T>(branch: Fragment<T, any>) {
  const leaves = toLeaves<string | undefined>(branch);
  if (_.keys(leaves).length !== 1)
    throw new Error(
      `Expected a branch of single leaf, received this instead: ${JSON.stringify(
        branch,
      )}`,
    );
  const [path, value] = _.entries(leaves)[0];
  return [path, value] as const;
}
