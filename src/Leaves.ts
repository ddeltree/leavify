export type Leaves<T extends Leaf = Leaf> = Generator<
  [string, T, Property[]],
  undefined
>;

/** Asserts that T is a Leaf -
 * a type that can be interpolated in template literals */
export type Leaf<T = undefined> = T extends undefined
  ? string | number | bigint | boolean | null | undefined
  : T extends Leaf
  ? T
  : never;

export type Property = {
  name: string;
  isArrayIndex: boolean;
};
