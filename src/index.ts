import { get, set, has } from '@accessors/accessors.js';
import toTree from '@accessors/toTree.js';
import findDifference from '@accessors/findDifference.js';
import changes from './changes/index.js';

import type { Primitive, Fragment } from '@typings';
import walkLeaves from '@accessors/walkLeaves.js';

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
export { Primitive as Leaf, Fragment };
