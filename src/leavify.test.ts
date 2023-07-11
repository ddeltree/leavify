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

test('toLeaves returns single value for proper branch inputs', () => {
  const branches = generateBranches();
  for (const branch of branches)
    expect(_.keys(toLeaves(branch)).length).toBe(1);
});

test('toLeaves returns empty for branches with no leaf values', () => {
  const branches = generateBranches({ withLeaf: false });
  for (const branch of branches)
    expect(_.keys(toLeaves(branch)).length).toBe(0);
});

function is_tree_equal_leavesToTree<T>(tree: T) {
  const inversed = toTree(toLeaves(tree));
  return str(tree) === str(inversed);
}
