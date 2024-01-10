import { get, set, has } from './accessors.js';
import toTree from './toTree.js';
import toLeaves from './toLeaves.js';
import findDifference from './findDifference.js';

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
  toLeaves,
  findDifference,
  fromBranch,
  walkLeaves,
};

export default leaves;
export { Leaves, Leaf, Fragment, Branch };
