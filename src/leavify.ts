import _ from 'lodash';
import { set, get } from './setter';

// TODO? decide whether the input is Leaves or Tree by object depth
// if the level is 1, toLeaves gives the same output as toTree

// TODO write tests for every combination of nested list or object up to level 4 of nesting
// This way, level 3 is the analogous case of all the sub-objects,
// since it has both a parent and a child, each of which may be list or object.
// 2^4 + 2^3 + ... = 31

// TODO The analogy of the rest can probably be prooved by mathematical induction. Find out how
// principio da indução finita

const example1 = {
  a: [
    {
      f: [],
    },
  ],
};

// TODO similarly to the above, write tests for leaf values in combination to object values, perhaps to the length of 3 for each object
// basically, imagine the object tree as a 4x3 (nesting x length) jagged array
// except for the former is not always an array (there's only one object/array for each nesting level)

const example2 = {
  a: [
    'one',
    'two',
    {
      d: null,
      f: ['three', 'four', 'five'],
      e: 42,
    },
  ],
  b: 13,
  c: undefined,
};

// TODO implement functions to compare changes, and define a type for a object subset (a recursive Partial type)

/** Converts an object to a pair of it's leaf (non object) values and their respective paths
 * @param mapLeaf allows to transform the leaf value into any other
 */
export function toLeaves<TLeaf>(
  obj: any,
  mapLeaf: (value: unknown, path: string) => TLeaf = (x) => x as TLeaf,
): Leaves<TLeaf> {
  // flatten
  function flatten(ob: any) {
    const result: Leaves<TLeaf> = {};
    _.forEach(ob, (value, key) => {
      result[key] = value;
      if (!_.isObject(value)) return; // leaf
      const flat = flatten(value);
      _.forEach(flat, (subValue, subKey) => {
        const k = key + (_.isArray(value) ? '[' : '.') + subKey;
        result[k] = subValue;
      });
    });
    return result;
  }
  // map
  const isRootArr = _.isArray(obj);
  const toReturn = _.fromPairs(
    _.map(flatten(obj), (value, p) => {
      let path = p.replaceAll(/\[(\d+)/g, '[$1]');
      if (isRootArr) path = path.replace(/^(\d+)(\..+)?/, '[$1]$2');
      return [path, mapLeaf(value, path)];
    }),
  );
  return toReturn;
}

/** from path-value pairs to object */
export function toTree<TLeaf>(
  leaves: Leaves<TLeaf>,
  mapLeaf: (value: TLeaf, path: string) => any = (x) => x,
): any {
  if (_.isEmpty(leaves)) return undefined;
  const first = _.first(_.keys(leaves))!;
  const toReturn: any = first.startsWith('[') ? [] : {} ?? {};
  _.forEach(leaves, (value, path) => set(toReturn, path, mapLeaf(value, path)));
  return toReturn;
}

type Leaves<T> = Record<string, T>;

function create() {
  const branches: any[] = [];

  _.range(1, 5).forEach((digitCount) =>
    _.range(0, 2 ** digitCount).forEach((value) => {
      const bits = value.toString(2);
      const bitArr = '0'.repeat(digitCount - bits.length) + bits;
      const arrDict: ({} | [])[] = _.map(bitArr, (bit) =>
        bit === '0' ? {} : [],
      );
      const branch = arrDict.reduce((prev, curr) => {
        if (prev === null) return curr;
        const res: any = curr;
        res[0] = prev;
        return res;
      }, null as any);
      branches.push(branch);
    }),
  );
  console.log(JSON.stringify(branches, null, 1));
}
create();
