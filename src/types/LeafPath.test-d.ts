/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectError, expectNotType } from 'tsd';
import LeafPath, { Refs } from './LeafPath.js';
import { OriginalEntries } from '../changes/Changeable.js';
import Fragment from './Fragment.js';
import { get } from '../accessors.js';

declare function check<T extends object, U extends LeafPath<T> = LeafPath<T>>(
  path: U,
): U;

// Inheritance
class X {
  name!: string;
}
interface Y {
  id: number;
}
class Z extends X implements Y {
  id!: number;
}
expectNotType<never>(check<Z>('id'));
expectNotType<never>(check<Z>('name'));

// The paths of the union is the union of the paths of each union element
type DistributivePathUnion<
  T extends object,
  U extends Fragment<T> = Fragment<T>,
  _UNION extends Refs<T | U> = Refs<T> | Refs<U>,
> = T;

// object not marked `as const` can interpolate indices
expectNotType<never>(check<typeof ob1>('objects[30].id'));
const ob1 = {
  objects: [
    {
      id: 2,
    },
  ],
  numbers: [1, 2, 3],
};

// functions are not valid
class Test {
  name!: string;
  other!: [string, number];
  get prop() {
    return true;
  }
  myFunction() {}
}
expectNotType<never>(check<Test>('other[1]'));
expectError(check<Test>('myFunction'));

// ChangeableEntries' paths are not valid
type Props = { leaf: number };
interface A extends Props {
  leaf: number;
  original: OriginalEntries<Props>;
}
expectNotType<never>(check<A>('leaf'));
expectError(check<A>('original.b'));

// ChangeableEntries' refs paths are valid
const a: A = {
  leaf: 42,
  original: {
    leaf: 2,
  },
};
get(a.original, 'leaf');
get(a.original, 'leaf' as LeafPath<A>);
