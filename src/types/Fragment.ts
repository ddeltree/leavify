import RecursivePartial from '../RecursivePartial/index.js';

/** An object which is a subset of another of type T
 * (recursive partial T).
 * @param TLeaf types a mapped leaf
 * */

type Fragment<T extends object> = T extends object
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    T extends Function
    ? never
    : T | RecursivePartial<T>
  : never;

export default Fragment;

/** Prevents too much recursivity */
export type NoFragment<T> = T extends Fragment<infer V>
  ? V extends object
    ? V
    : never
  : T;
