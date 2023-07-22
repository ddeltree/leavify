import _ from 'lodash';
import { Change, findChanges } from './changes';
import { Leaf, toLeaves } from './leavify';
import { get, set } from './setter';

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
    changed: {
      original: original.changed,
      change: fragment.changed,
    } as Change,
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
  const changedLeaves = toLeaves(
    findChanges(original, fragment, {
      mapLeaf: (__, change) => change,
    }),
  );
  expect(changedLeaves).toEqual({
    [changePath]: get(fragment, changePath),
  });
});
