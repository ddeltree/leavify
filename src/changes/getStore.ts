import { CHANGES_SYMBOL, Changeable } from './Changeable.js';

/** Boilerplate for a class getter of the stored fragment of original values.
 * @param thisRef a reference to the `this` class instance.
 * @param _getterNames the names of the getters within the class, for both `proposed` and `original` fragments, in order to prevent circular reference.
 */
export function getOriginals<T extends object, K extends keyof T>(
  thisRef: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._getterNames: K[]
) {
  return (thisRef as Changeable<Omit<T, K>>)[CHANGES_SYMBOL]?.original;
}

/** Boilerplate for a class getter of the stored fragment of proposed values.
 * @param thisRef a reference to the `this` class instance.
 * @param getterNames the names of the getters within the class, for both `proposed` and `original` fragments, in order to prevent circular reference.
 */
export function getProposed<T extends object, K extends keyof T>(
  thisRef: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._getterNames: K[]
) {
  return (thisRef as Changeable<Omit<T, K>>)[CHANGES_SYMBOL]?.proposed;
}
