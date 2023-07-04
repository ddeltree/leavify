import _ from 'lodash';
import { set, get } from './setGet.js';

/** from object to path-value pairs */
function toLeaves(obj, mapLeaf = (x, __) => x) {
  // flatten
  function flatten(ob) {
    const result = {};
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
function toTree(obj, mapLeaf = (x, __) => x) {
  const first = _.first(_.keys(obj));
  if (first === undefined) return null;
  const toReturn = first?.startsWith('[') ? [] : {} ?? {};
  _.forEach(obj, (value, path) => {
    set(toReturn, path, mapLeaf(value, path));
  });
  return toReturn;
}

function test(tree) {
  const leaves = toLeaves(tree);
  const inversed = toTree(leaves);
  const str = (v) => JSON.stringify(v, null, 0);
  console.log(str(tree));
  console.log(str(inversed));
  console.log(str(tree) === str(inversed));
  // console.log(JSON.stringify(leaves, null, 2));
}

const ob = {};
test(ob);
