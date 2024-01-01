import _ from 'lodash';
import { Leaves, Leaf } from './Leaves.js';

/** Create a path-value pair record of all the leaf values within an object
 * @param mapLeaf allows to transform the leaf value into any other
 */
export default function toLeaves<T extends Leaf>(
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
      let path = _.replace(p, /\[(\d+)/g, '[$1]');
      // let path = p.replaceAll(/\[(\d+)/g, '[$1]');
      if (isRootArr) path = path.replace(/^(\d+)(\..+)?/, '[$1]$2');
      return [path, mapLeaf(value, path)];
    }),
  );
  return toReturn;
}
