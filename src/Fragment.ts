import RecursivePartial from './RecursivePartial/index.js';
import { Tree } from './Tree.js';

/** An object which is a subset of another of type T
 * (recursive partial T).
 * @param TLeaf types a mapped leaf
 * */
export type Fragment<T, TLeaf = undefined> = T extends object
  ? Tree<RecursivePartial<T>, TLeaf>
  : never;
