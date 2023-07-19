// FOREACH (key of Type):
//  IF   (value is array of U)  make it array of partial U
//  ELIF (value is object)      make its entries partial
//  ELSE                        return leaf value
// stackoverflow.com/a/51365037
type RecursivePartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[K] extends object | undefined
    ? RecursivePartial<T[K]>
    : T[K];
};

export default RecursivePartial;
