import RecursivePartial from './RecursivePartial/index.js';

/** An object which is a subset of another of type T
 * (recursive partial T).
 * @param TLeaf types a mapped leaf
 * */
type Fragment<T, TLeaf = undefined> = T extends object
  ? Tree<RecursivePartial<T>, TLeaf>
  : never;

export default Fragment;

type Tree<T, TLeaf = undefined> = {
  [K in keyof T]: T[K] extends (infer U)[]
    ? Tree<U, TLeaf>[]
    : T[K] extends object | undefined
    ? Tree<T[K], TLeaf>
    : TLeaf extends undefined
    ? T[K]
    : TLeaf;
};
