import _ from 'lodash';
import { Primitive, Property } from '../types/Leaves.js';
import LeafPath from '../types/LeafPath.js';

export default function* walkLeaves<T extends object>(
  ob: T,
): Generator<
  readonly [LeafPath<T>, Primitive, readonly Property[]],
  undefined
> {
  const paths: string[] = [];
  const generators = [makeGenerator(ob)];
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
      generators.push(makeGenerator(value));
      paths.push(path);
      properties.push(prop);
    } else {
      yield [
        [...paths, path].join('') as LeafPath<T>,
        value,
        [...properties, prop],
      ];
    }
  }
}

function* makeGenerator(
  ob: object,
): Generator<readonly [string, object | Primitive, Property], undefined> {
  for (const [key, value] of Object.entries(ob)) {
    let path = _.isArray(ob) ? `[${key}]` : key;
    // [num].prop || prop1.prop2 <=> child is object and not array
    if (_.isObject(value) && !_.isArray(value)) path += '.';
    yield [path, value, { name: key, isArrayIndex: _.isArray(ob) }];
  }
}
