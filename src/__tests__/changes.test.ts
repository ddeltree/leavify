import _ from 'lodash';
import { test, expect } from 'vitest';
import findDifference from '../findDifference';
import toLeaves from '../toLeaves';
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
  const changes = findDifference(original, fragment);
  expect(changes).toEqual({
    changed: fragment.changed,
  });
  expect(changes.unchanged).toBe(undefined);
});

test('nested value change', () => {
  const original = {
    changed: [1, { prop: 'X' }],
    unchanged: { other: [0, 1] },
  };
  const fragment: typeof original = _.cloneDeep(original);
  const changePath = 'changed[1].prop';
  set(fragment, changePath, 'change value');
  const changedLeaves = toLeaves(findDifference(original, fragment));
  expect(changedLeaves).toEqual({
    [changePath]: get(fragment, changePath),
  });
});
