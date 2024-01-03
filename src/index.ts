import { get, set, has } from './accessors.js';
import toTree from './toTree.js';
import toLeaves from './toLeaves.js';
import findDifference from './findDifference.js';

import type { Leaves, Leaf } from './Leaves.js';
import type Fragment from './Fragment.js';

const leaves = {
  get,
  set,
  has,
  toTree,
  toLeaves,
  findDifference,
};

export default leaves;
export type { Leaves, Leaf, Fragment };
