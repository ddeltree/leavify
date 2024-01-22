import _ from 'lodash';
import { Primitive } from './Leaves.js';
import RecursivePartial from '../RecursivePartial/index.js';
import Fragment from './Fragment.js';

type FindLeaves<
  value extends object,
  pathAcc extends Primitive = undefined,
> = value extends readonly any[] // ARRAY
  ? EntriesOf<value>[keyof value] extends infer Entry
    ? Entry extends [Primitive, any]
      ? pathAcc extends undefined
        ? FindLeaves<Entry[1], `[${Entry[0]}]`>
        : FindLeaves<Entry[1], `${pathAcc}[${Entry[0]}]`>
      : never
    : never
  : value extends object // OBJECT
  ? EntriesOf<value>[keyof value] extends infer Entry
    ? Entry extends [Primitive, any]
      ? pathAcc extends undefined
        ? FindLeaves<Entry[1], Entry[0]>
        : FindLeaves<Entry[1], `${pathAcc}.${Entry[0]}`>
      : never
    : never
  : `${pathAcc}`;

type EntriesOf<T> = {
  [K in keyof T]: [K, T[K]];
};

/** Prevents too much recursivity */
type NoFragment<T> = T extends Fragment<infer V>
  ? V extends object
    ? V
    : never
  : T;
type LeafPath<T extends object> = FindLeaves<NoFragment<T>>;
export default LeafPath;
