// FOREACH (key of Type):
//  IF   (value is array of U)  make it array of partial U
//  ELIF (value is object)      make its values partial
//  ELSE                        return leaf value

type RecursivePartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[K] extends object | undefined
    ? RecursivePartial<T[K]>
    : T[K];
};

export default RecursivePartial;
