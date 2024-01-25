import _ from 'lodash';
import { test, expect, describe, beforeEach } from 'vitest';
import findDifference from '../findDifference';
import LeafPath from '../types/LeafPath';

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

describe('findDifference()', () => {
  let original: Example;
  let fragment: typeof original;
  beforeEach(() => {
    original = {
      nested: [1, { prop: 'X' }],
      unchanged: { other: [0, 1] },
      flat: 'X',
    };
    fragment = _.cloneDeep(original);
  });

  test('flat value change', () => {
    fragment.flat = 'Y';
    const diff = findDifference(original, fragment);
    expect(diff.next().value).containSubset(['flat', fragment.flat]);
    expect(diff.next().done).toBe(true);
  });

  test('nested value change', () => {
    const path: LeafPath<Example> = 'nested[1].prop';
    _.set(fragment, path, 'change value');
    const diff = findDifference(original, fragment);
    expect(diff.next().value).containSubset([path, _.get(fragment, path)]);
    expect(diff.next().done).toBe(true);
  });
});
