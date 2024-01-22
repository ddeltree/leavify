import { Primitive } from './Leaves.js';
import RecursivePartial from '../RecursivePartial/index.js';

/** An object which is a subset of another of type T
 * (recursive partial T).
 * @param TLeaf types a mapped leaf
 * */
// type Fragment<T extends object, TLeaf = undefined> = Fragment<
//   T | Tree<RecursivePartial<T>, TLeaf>
// >;

type Fragment<T extends object> = T extends object
  ? T extends Function
    ? never
    : T | RecursivePartial<T>
  : never;

export default Fragment;
