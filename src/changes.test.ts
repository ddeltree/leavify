import { Change, findChanges } from './changes';
import { Leaf, toLeaves } from './leavify';
import { get } from './setter';

test('flat value change', () => {
  const original = {
    changed: 'x',
    unchanged: 42,
  };
  const fragment: typeof original = {
    ...original,
    changed: 'y',
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
    changed: [1, { prop: 'x' }],
    unchanged: { other: [0, 1] },
  };
  const fragment: typeof original = {
    ...original,
    changed: [1, { prop: 'y' }],
  };
  const changedLeaves = toLeaves(
    findChanges(original, fragment, {
      mapLeaf: (__, change) => change,
    }),
  );
  const path = 'changed[1].prop';
  expect(changedLeaves).toEqual({
    [path]: get(fragment, path),
  });
});
