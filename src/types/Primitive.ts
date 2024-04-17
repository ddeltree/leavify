/** Asserts that T is a primitive or leaf - a type that can be interpolated in template literals */
type Primitive<T = undefined> =
  T extends undefined ? string | number | bigint | boolean | null | undefined
  : T extends Primitive ? T
  : never;

export default Primitive;
