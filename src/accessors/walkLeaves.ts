import _ from 'lodash';
import { Primitive, LeafPath } from '@typings';

/** Generate the leaf value entries inside the object */
export default function* walkLeaves<T extends object>(target: T) {
  for (const [path, value] of new Branch(target)) {
    yield [path as LeafPath<T>, value] as const;
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
    if (this.values.includes(value)) return;
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
    const { value, done } = _.last(this.childrenIterators)!.next();
    return done === true ? undefined : value;
  }
  isDone() {
    return this.childrenIterators.length == 0;
  }
  toString() {
    return this.keys.join('');
  }

  *[Symbol.iterator]() {
    while (!this.isDone()) {
      const child = this.getNextChild();
      if (!child) {
        this.pop();
        continue;
      }
      const [key, value] = child;
      if (_.isObject(value)) {
        this.push([key, value]);
      } else {
        yield [this.toString() + key, value] as const;
      }
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
