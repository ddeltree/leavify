import _ from 'lodash';
import { Leaves, Leaf } from './Leaves.js';

/** Create a path-value pair record of all the leaf values within an object */
export default function toLeaves<T extends Leaf>(obj: object): Leaves<T> {
  const leaves = [...walkLeaves(obj)].map(([a, b]) => [a, b]);
  const toReturn = _.fromPairs(leaves);
  return toReturn;
}

export function* walkLeaves(ob: object) {
  const paths: string[] = [];
  const generators = [generate(ob)];
  const properties: Property[] = [];

  while (generators.length > 0) {
    const currGenerator = _.last(generators)!;
    const entry = currGenerator.next();
    if (entry.done) {
      generators.pop();
      paths.pop();
      properties.pop();
      continue;
    }

    const [path, value, prop] = entry.value;
    if (_.isObject(value)) {
      generators.push(generate(value));
      paths.push(path);
      properties.push(prop);
    } else {
      yield [[...paths, path].join(''), value, [...properties, prop]];
    }
  }
}

type Property = {
  name: string;
  isArrayIndex: boolean;
};

function* generate(ob: object): Generator<[string, object | Leaf, Property]> {
  for (const [key, value] of Object.entries(ob)) {
    let path = _.isArray(ob) ? `[${key}]` : key;
    // [num].prop || prop1.prop2 <=> child is object and not array
    if (_.isObject(value) && !_.isArray(value)) path += '.';
    yield [path, value, { name: key, isArrayIndex: _.isArray(ob) }];
  }
}
