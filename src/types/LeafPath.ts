/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Primitive } from './Leaves.js';
import Fragment, { NoFragment } from './Fragment.js';

type FindLeaves<
  value extends object | Primitive,
  pathAcc extends string | undefined = undefined,
> = value extends Function
  ? never
  : value extends object
  ? EntriesOf<value>[keyof value] extends infer Entry
    ? Entry extends [string | number, object | Primitive]
      ? FindLeaves<Entry[1], ToString<value, pathAcc, Entry[0]>>
      : never
    : never
  : `${pathAcc}`;

type EntriesOf<T> = {
  [K in keyof T]: [K, T[K]];
};

type ToString<
  value extends object | Primitive,
  pathAcc extends string | undefined,
  key extends string | number,
> = value extends readonly unknown[]
  ? pathAcc extends undefined
    ? `[${key}]`
    : `${pathAcc}[${key}]`
  : pathAcc extends undefined
  ? `${key}`
  : `${pathAcc}.${key}`;

// BUG IntelliSense freezes when passing `any` to LeafPath
type LeafPath<T extends object> =
  // eslint-disable-next-line @typescript-eslint/ban-types
  FindLeaves<NoFragment<T>>;
export default LeafPath;

// TESTING TYPES

() => {
  const // @ts-check object not marked `as const` can interpolate indices
    _1: FindLeaves<typeof ob1> = 'objects[0].id',
    ob1 = {
      objects: [
        {
          id: 2,
        },
      ],
      numbers: [1, 2, 3],
    };

  const _t1: LeafPath<Test> = 'other[1]',
    // @ts-expect-error property does
    _t2: LeafPath<Test> = '';
  class Test {
    name!: string;
    other!: [string, number];
    get prop() {
      return true;
    }
  }
};
