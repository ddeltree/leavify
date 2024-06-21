import _ from 'lodash';
import { Primitive, LeafPath } from '@typings';

export default function* walkLeaves<T extends object>(
  target: T,
): Generator<readonly [LeafPath<T>, Primitive], undefined> {
  const branch = new Branch(target);
  while (!branch.isDone()) {
    const child = branch.getNextChild();
    if (child.done) {
      branch.pop();
      continue;
    }
    const [key, value] = child.value;
    if (_.isObject(value)) {
      branch.push([key, value]);
    } else {
      yield [(branch.toString() + key) as LeafPath<T>, value];
    }
  }
}

class Branch {
  private readonly keys: string[] = [];
  private readonly values: object[];
  private readonly childrenIterators: Generator<
    readonly [string, object | Primitive],
    undefined
  >[];
  constructor(target: object) {
    this.childrenIterators = [makeChildEntryGenerator(target)];
    this.values = [target];
  }
  has(value: object) {
    return this.values.includes(value);
  }
  push([key, value]: [string, object]) {
    if (this.values.includes(value))
      throw new Error('Unexpected circular reference!');
    this.keys.push(key);
    this.values.push(value);
    this.childrenIterators.push(makeChildEntryGenerator(value));
  }
  pop() {
    this.keys.pop();
    this.values.pop();
    this.childrenIterators.pop();
  }
  getNextChild() {
    return _.last(this.childrenIterators)!.next();
  }
  isDone() {
    return this.childrenIterators.length == 0;
  }
  toString() {
    return this.keys.join('');
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
