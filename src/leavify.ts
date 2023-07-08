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
  if (_.isEmpty(leaves)) return undefined;
  const first = _.first(_.keys(leaves))!;
  const toReturn: any = first.startsWith('[') ? [] : {} ?? {};
  _.forEach(leaves, (value, path) => set(toReturn, path, mapLeaf(value, path)));
  return toReturn;
}

type Leaves<T> = Record<string, T>;
