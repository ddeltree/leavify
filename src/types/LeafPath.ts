/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Primitive } from './Leaves.js';
import { NoFragment } from './Fragment.js';
import { ChangeableEntries } from '../changes/Changeable.js';

type FindLeaves<
  REF extends object | Primitive,
  PARENTS = never,
  PATH_ACC extends string | undefined = undefined,
> = REF[keyof REF] extends ChangeableEntries
  ? never
  : REF extends Function
  ? never
  : REF extends object
  ? EntriesOf<REF>[keyof REF] extends infer ENTRY
    ? ENTRY extends [string | number, object | Primitive]
      ? ENTRY[1] extends PARENTS
        ? // interpolate circular references to `any`
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ToString<REF, PATH_ACC, `${ENTRY[0]}`, any>
        : FindLeaves<ENTRY[1], PARENTS | REF, ToString<REF, PATH_ACC, ENTRY[0]>>
      : never
    : never
  : `${PATH_ACC}`;

type EntriesOf<T> = {
  [K in keyof T]: [K, T[K]];
};

type ToString<
  value extends object | Primitive,
  pathAcc extends string | undefined,
  key extends string | number,
  tail extends string = '',
> = value extends readonly unknown[]
  ? pathAcc extends undefined
    ? `[${key}]${tail}`
    : `${pathAcc}[${key}]${tail}`
  : pathAcc extends undefined
  ? `${key}${tail}`
  : `${pathAcc}.${key}${tail}`;

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
