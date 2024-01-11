import _ from 'lodash';
import { test, expect } from 'vitest';
import findDifference from '../findDifference';
import { get, set } from '../accessors';

test('flat value change', () => {
  const original = {
    changed: 'X',
    unchanged: 42,
  };
  const fragment: typeof original = {
    ...original,
    changed: 'Y',
  };
  const diff = findDifference(original, fragment);
  expect(diff.next().value).containSubset(['changed', fragment.changed]);
  expect(diff.next().done).toBe(true);
});

test('nested value change', () => {
  const original = {
    changed: [1, { prop: 'X' }],
    unchanged: { other: [0, 1] },
  };
  const fragment: typeof original = _.cloneDeep(original);
  const path = 'changed[1].prop';
  set(fragment, path, 'change value');

  const diff = findDifference(original, fragment);
  expect(diff.next().value).containSubset([path, get(fragment, path)]);
  expect(diff.next().done).toBe(true);
});
