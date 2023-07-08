import _ from 'lodash';
import { set, get } from './setter';

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
  const first = _.first(_.keys(leaves));
  if (first === undefined) return undefined;
  const toReturn: any = first?.startsWith('[') ? [] : {} ?? {};
  _.forEach(leaves, (value, path) => set(toReturn, path, mapLeaf(value, path)));
  return toReturn;
}

function test<T>(tree: T) {
  const leaves = toLeaves(tree);
  const inversed = toTree(leaves);
  const str = (v: any) => JSON.stringify(v, null, 0);
  console.log(str(tree));
  console.log(str(inversed));
  console.log(str(tree) === str(inversed));
  // console.log(JSON.stringify(leaves, null, 2));
}

type Leaves<T> = Record<string, T>;
