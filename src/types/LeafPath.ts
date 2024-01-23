import { Primitive } from './Leaves.js';
import { NoFragment } from './Fragment.js';

type FindLeaves<
  value extends object | Primitive,
  pathAcc extends string | undefined = undefined,
> = value extends object
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
  (string & {}) | FindLeaves<NoFragment<T>>;
export default LeafPath;

// TESTING TYPES

() => {
  // @ts-check object not marked `as const` can interpolate indices
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _: FindLeaves<typeof ob> = 'objects[0].id',
    ob = {
      objects: [
        {
          id: 2,
        },
      ],
      numbers: [1, 2, 3],
    };
};
