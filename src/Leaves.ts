export type Leaves<T extends Leaf = Leaf> = Generator<
  [string, T, Property[]],
  undefined
>;
export type Leaf = string | number | boolean | null | undefined;

export type Property = {
  name: string;
  isArrayIndex: boolean;
};
