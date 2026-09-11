import { Primitive, LeafPath, LeafValue } from '@typings';
import { isObject, last } from '@utils/objects.js';

/** One leaf of `T`: its path, paired with the value sitting at that path.
 *
 * This is a discriminated union over the path, so narrowing on the path narrows
 * the value to that leaf's type — the same shape as {@link LeafDiff}.
 */
export type LeafEntry<T extends object, P extends LeafPath<T> = LeafPath<T>> =
  P extends unknown ? readonly [path: P, value: LeafValue<T, P>] : never;

/** Generate the leaf value entries inside the object.
 *
 * A field marked `Hidden` is absent from `LeafPath<T>` but still enumerated
 * here — the marker emits no runtime code, so this walker cannot see it.
 */
export default function* walkLeaves<T extends object>(
  target: T,
): Generator<LeafEntry<T>> {
  for (const [path, value] of new Branch(target)) {
    yield [path, value] as unknown as LeafEntry<T>;
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
    const { value, done } = last(this.childrenIterators)!.next();
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
      if (isObject(value)) {
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
    let path = Array.isArray(ob) ? `[${key}]` : key;
    if (isObject(value) && !Array.isArray(value)) path += '.';
    yield [path, value];
  }
}
