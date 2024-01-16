type Tree<T, TLeaf = undefined> = {
  [K in keyof T]: T[K] extends (infer U)[]
    ? Tree<U, TLeaf>[]
    : T[K] extends object | undefined
    ? Tree<T[K], TLeaf>
    : T[K];
};

export default Tree;
