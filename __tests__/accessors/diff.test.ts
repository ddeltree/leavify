import { test, expect, describe, beforeEach } from 'vitest';
import diff from '@accessors/diff.js';
import { LeafPath } from '@typings';

interface Example {
  nested: (
    | {
        prop: string;
      }
    | number
  )[];
  unchanged: {
    other: number[];
  };
  flat: string;
}

describe('diff()', () => {
  let before: Example;
  let after: typeof before;
  beforeEach(() => {
    before = {
      nested: [1, { prop: 'X' }],
      unchanged: { other: [0, 1] },
      flat: 'X',
    };
    after = structuredClone(before);
  });

  test('flat value change', () => {
    after.flat = 'Y';
    const changes = diff(before, after);
    expect(changes.next().value).toEqual(['flat', 'X', 'Y']);
    expect(changes.next().done).toBe(true);
  });

  test('nested value change', () => {
    const path: LeafPath<Example> = 'nested[1].prop';
    (after.nested[1] as { prop: string }).prop = 'change value';
    const changes = diff(before, after);
    expect(changes.next().value).toEqual([path, 'X', 'change value']);
    expect(changes.next().done).toBe(true);
  });

  test('identical objects yield nothing', () => {
    expect([...diff(before, after)]).toEqual([]);
  });

  test('a leaf missing from before yields undefined', () => {
    const changes = diff({ a: 1 } as { a: number; b?: number }, {
      a: 1,
      b: 2,
    });
    expect([...changes]).toEqual([['b', undefined, 2]]);
  });

  test('accepts a sparse fragment as the after side', () => {
    expect([...diff(before, { flat: 'Y' })]).toEqual([['flat', 'X', 'Y']]);
  });
});
