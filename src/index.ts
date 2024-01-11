import { get, set, has } from './accessors.js';
import toTree from './toTree.js';
import findDifference from './findDifference.js';
import changes from './changes/index.js';

import type { Leaves, Leaf } from './Leaves.js';
import type Fragment from './Fragment.js';
import type Branch from './Branch.js';
import fromBranch from './fromBranch.js';
import walkLeaves from './walkLeaves.js';

const leaves = {
  get,
  set,
  has,
  toTree,
  findDifference,
  fromBranch,
  walkLeaves,
  changes,
};

export default leaves;
export { Leaves, Leaf, Fragment, Branch };
