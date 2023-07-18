import _ from 'lodash';
import { set, get } from './setter';

// TODO? decide whether the input is Leaves or Tree by object depth
// if the level is 1, toLeaves gives the same output as toTree

/** Converts an object to a pair of it's leaf (non object) values and their respective paths
 * * brackets are used to identify arrays, so `[string]` never happens
 * @param mapLeaf allows to transform the leaf value into any other
 */
export function toLeaves<T extends Leaf>(
  obj: any,
  mapLeaf: (value: unknown, path: string) => T = (x) => x as T,
): Leaves<T> {
  // flatten
  function flatten(ob: any) {
    const result: Leaves<T> = {};
    _.forEach(ob, (value, key) => {
      if (!_.isObject(value)) return (result[key] = value); // leaf
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
export function toTree<T extends Leaf>(
  leaves: Leaves<T>,
  mapLeaf: (value: T, path: string) => any = (x) => x,
): any | undefined {
  if (_.isEmpty(leaves)) return undefined;
  const first = _.first(_.keys(leaves))!;
  const toReturn: any = first.startsWith('[') ? [] : {} ?? {};
  _.forEach(leaves, (value, path) => set(toReturn, path, mapLeaf(value, path)));
  return toReturn;
}

export type Leaves<T extends Leaf> = Record<string, T>;
export type Leaf = string | number | boolean | null | undefined;
