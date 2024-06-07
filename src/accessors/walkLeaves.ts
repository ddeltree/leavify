import _ from 'lodash';
import { Primitive, LeafPath } from '@typings';

export default function* walkLeaves<T extends object>(
  target: T,
): Generator<readonly [LeafPath<T>, Primitive], undefined> {
  const branch = [makeChildEntryGenerator(target)];
  const nodeKeys: string[] = [];
  while (branch.length > 0) {
    const innerNode = _.last(branch)!;
    const child = innerNode.next();
    if (child.done) {
      branch.pop();
      nodeKeys.pop();
      continue;
    }
    const [key, value] = child.value;
    if (_.isObject(value)) {
      branch.push(makeChildEntryGenerator(value));
      nodeKeys.push(key);
    } else {
      yield [[...nodeKeys, key].join('') as LeafPath<T>, value];
    }
  }
}

function* makeChildEntryGenerator(
  ob: object,
): Generator<readonly [string, object | Primitive], undefined> {
  for (const [key, value] of Object.entries(ob)) {
    let path = _.isArray(ob) ? `[${key}]` : key;
    if (_.isObject(value) && !_.isArray(value)) path += '.';
    yield [path, value];
  }
}
