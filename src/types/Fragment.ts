/* eslint-disable @typescript-eslint/ban-types */
import RecursivePartial from './RecursivePartial.js';

/** An object which is a subset of another of type T
 * (recursive partial T).
 * @param TLeaf types a mapped leaf
 * */

type Fragment<T extends object> =
  T extends Function ? never : T | RecursivePartial<T>;

export default Fragment;
