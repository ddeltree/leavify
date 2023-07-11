import _ from 'lodash';
import { toLeaves, toTree } from './leavify';
import { generateBranches, str } from './testHelpers';

test('empty array', () => {
  expect(is_tree_equal_leavesToTree([])).toBe(false);
});

test('empty object', () => {
  expect(is_tree_equal_leavesToTree({})).toBe(false);
});

test('nesting combinations up to level 5', () => {
  const branches = generateBranches();
  expect(is_tree_equal_leavesToTree(branches)).toBe(true);
  for (const branch of branches)
    expect(is_tree_equal_leavesToTree(branch)).toBe(true);
});

function is_tree_equal_leavesToTree<T>(tree: T) {
  const inversed = toTree(toLeaves(tree));
  return str(tree) === str(inversed);
}
