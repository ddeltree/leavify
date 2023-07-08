import { toLeaves, toTree } from './leavify';

test('empty array', () => {
  expect(is_tree_equal_leavesToTree([])).toBe(false);
});

test('empty object', () => {
  expect(is_tree_equal_leavesToTree({})).toBe(false);
});

function is_tree_equal_leavesToTree<T>(tree: T) {
  const inversed = toTree(toLeaves(tree));
  return str(tree) === str(inversed);
}

const str = (v: any) => JSON.stringify(v, null, 0);
