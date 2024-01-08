import _ from 'lodash';
import { Leaves, Leaf } from './Leaves.js';

/** Create a path-value pair record of all the leaf values within an object
 * @param mapLeaf allows to transform the leaf value into any other
 */
export default function toLeaves<T extends Leaf>(
  obj: any,
  mapLeaf: (value: unknown, path: string) => T = (x) => x as T,
): Leaves<T> {
  const isRootArr = _.isArray(obj);
  const toReturn = _.fromPairs(
    _.map(flatten(obj), (value, p) => {
      let path = _.replace(p, /\[(\d+)/g, '[$1]');
      if (isRootArr) path = path.replace(/^(\d+)(\..+)?/, '[$1]$2');
      return [path, mapLeaf(value, path)];
    }),
  );
  return toReturn;
}

function flatten(ob: any) {
  const result: Leaves = {};
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

function* walkLeaves(ob: object) {
  const keys: string[] = [];
  const generators = [generate(ob)];

  while (generators.length > 0) {
    const currGenerator = _.last(generators)!;
    const entry = currGenerator.next();
    if (entry.done) {
      generators.pop();
      keys.pop();
      continue;
    }

    const [key, value] = entry.value;
    if (_.isObject(value)) {
      generators.push(generate(value));
      keys.push(key);
    } else {
      yield [[...keys, key], value];
    }
  }
}

function* generate(ob: object) {
  for (const [key, value] of Object.entries(ob)) {
    yield [key, value];
  }
}

const ob = {
  name: 'davi',
  dados: [
    1,
    [2, 3, 4],
    {
      name: 'alexandre',
      resposta: 42,
    },
  ],
};
const iter = walkLeaves(ob);
// console.log(iter.next());
for (const [keys, leaf] of iter) {
  console.log(keys, leaf);
}
