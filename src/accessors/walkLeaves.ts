import _ from 'lodash';
import { Primitive, LeafPath } from '@typings';

export default function* walkLeaves<T extends object>(
  ob: T,
): Generator<readonly [LeafPath<T>, Primitive], undefined> {
  const paths: string[] = [];
  const generators = [makeGenerator(ob)];

  while (generators.length > 0) {
    const currGenerator = _.last(generators)!;
    const entry = currGenerator.next();
    if (entry.done) {
      generators.pop();
      paths.pop();
      continue;
    }

    const [path, value] = entry.value;
    if (_.isObject(value)) {
      generators.push(makeGenerator(value));
      paths.push(path);
    } else {
      yield [[...paths, path].join('') as LeafPath<T>, value];
    }
  }
}

function* makeGenerator(
  ob: object,
): Generator<readonly [string, object | Primitive], undefined> {
  for (const [key, value] of Object.entries(ob)) {
    let path = _.isArray(ob) ? `[${key}]` : key;
    // [num].prop || prop1.prop2 <=> child is object and not array
    if (_.isObject(value) && !_.isArray(value)) path += '.';
    yield [path, value];
  }
}
