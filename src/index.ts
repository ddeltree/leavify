import { get, set, has, walkLeaves, toTree, findDifference } from '@accessors';
import changes from './changes/index.js';

import type { Primitive, Fragment } from '@typings';

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
