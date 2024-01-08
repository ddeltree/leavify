import _ from 'lodash';
import { Leaves, Leaf } from './Leaves.js';

/** Create a path-value pair record of all the leaf values within an object
 * @param mapLeaf allows to transform the leaf value into any other
 */
export default function toLeaves<T extends Leaf>(obj: object): Leaves<T> {
  const toReturn = _.fromPairs([...walkLeaves(obj)]);
  return toReturn;
}

export function* walkLeaves(ob: object) {
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
      yield [[...keys, key].join(''), value];
    }
  }
}

function* generate(ob: object) {
  for (const [key, value] of Object.entries(ob)) {
    let k = _.isArray(ob) ? `[${key}]` : key;
    // [num].prop || prop1.prop2 <=> child is object and not array
    if (_.isObject(value) && !_.isArray(value)) k += '.';
    yield [k, value];
  }
}
