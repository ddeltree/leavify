import { get, set, has } from './accessors/accessors.js';
import toTree from './accessors/toTree.js';
import findDifference from './accessors/findDifference.js';
import changes from './changes/index.js';

import type { Leaves, Primitive } from './types/Leaves.js';
import type Fragment from './types/Fragment.js';
import walkLeaves from './accessors/walkLeaves.js';

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
