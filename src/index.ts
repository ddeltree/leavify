import { get, set, has } from './accessors.js';
import toTree from './toTree.js';
import toLeaves from './toLeaves.js';
import findDifference from './findDifference.js';

import type { Leaves, Leaf } from './Leaves.js';
import type Fragment from './Fragment.js';
import Branch, { fromBranch } from './Branch.js';

const leaves = {
  get,
  set,
  has,
  toTree,
  toLeaves,
  findDifference,
  fromBranch,
};

export default leaves;
export { Leaves, Leaf, Fragment, Branch };
