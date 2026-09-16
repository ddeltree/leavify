import { diff, get, has, mask, set, toTree, walkLeaves } from '@accessors';
import { omitLeaves, pickLeaves } from '@accessors';
import { fromPointer, toPointer } from '@accessors';

const leaves = {
  diff,
  fromPointer,
  get,
  has,
  mask,
  omitLeaves,
  pickLeaves,
  set,
  toPointer,
  toTree,
  walkLeaves,
};

export default leaves;

export * from '@accessors';
export type * from '@typings';
