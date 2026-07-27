import { diff, get, has, set, toTree, walkLeaves } from '@accessors';
import { fromPointer, toPointer } from '@accessors';

const leaves = {
  diff,
  fromPointer,
  get,
  has,
  set,
  toPointer,
  toTree,
  walkLeaves,
};

export default leaves;

export * from '@accessors';
export type * from '@typings';
