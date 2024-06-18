import { findDifference, get, has, set, toTree, walkLeaves } from '@accessors';
import changes from '@changes';

const leaves = {
  findDifference,
  get,
  has,
  set,
  toTree,
  walkLeaves,
  changes,
};

export default leaves;

export * from '@accessors';
export type * from '@typings';
export * as changes from '@changes';
