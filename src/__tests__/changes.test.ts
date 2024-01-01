import _ from 'lodash';
import { test, expect } from 'vitest';
import { findChanges } from '../findChanges';
import { toLeaves } from '../treeLeaves';
import { get, set } from '../properties';

test('flat value change', () => {
  const original = {
    changed: 'X',
    unchanged: 42,
  };
  const fragment: typeof original = {
    ...original,
    changed: 'Y',
  };
  const changes = findChanges(original, fragment);
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
  const changedLeaves = toLeaves(findChanges(original, fragment));
  expect(changedLeaves).toEqual({
    [changePath]: get(fragment, changePath),
  });
});
