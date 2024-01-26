import { get, set, has } from './accessors.js';
import toTree from './toTree.js';
import findDifference from './findDifference.js';
import changes from './changes/index.js';

import type { Leaves, Primitive } from './types/Leaves.js';
import type Fragment from './types/Fragment.js';
import walkLeaves from './walkLeaves.js';

const leaves = {
  get,
  set,
  has,
  toTree,
  findDifference,
  walkLeaves,
  changes,
};

export default leaves;
export { Leaves, Primitive as Leaf, Fragment };
