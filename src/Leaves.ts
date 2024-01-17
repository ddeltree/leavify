export type Leaves<T extends Primitive = Primitive> = Generator<
  [string, T, Property[]],
  undefined
>;

/** Asserts that T is a primitive or leaf - a type that can be interpolated in template literals */
export type Primitive<T = undefined> = T extends undefined
  ? string | number | bigint | boolean | null | undefined
  : T extends Primitive
  ? T
  : never;

export type Property = {
  name: string;
  isArrayIndex: boolean;
};
