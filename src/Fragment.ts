import { Primitive } from './Leaves.js';
import RecursivePartial from './RecursivePartial/index.js';
import Tree from './Tree.js';

/** An object which is a subset of another of type T
 * (recursive partial T).
 * @param TLeaf types a mapped leaf
 * */
// type Fragment<T extends object, TLeaf = undefined> = Fragment<
//   T | Tree<RecursivePartial<T>, TLeaf>
// >;

type Fragment<
  T extends object,
  TLeaf extends Primitive = undefined,
> = T extends object
  ? T extends Function
    ? never
    : T | Tree<RecursivePartial<T>, TLeaf>
  : never;

export default Fragment;
