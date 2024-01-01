import _ from 'lodash';
import { test, expect } from 'vitest';
import { toLeaves, toTree } from '../treeLeaves';
import { generateBranches } from './_testHelpers';

test('empty array', () => {
  expect(treeFromLeavesOf([])).toBe(undefined);
});

test('empty object', () => {
  expect(treeFromLeavesOf({})).toBe(undefined);
});

test('nesting combinations up to level 5', () => {
  const branches = generateBranches();
  expect(treeFromLeavesOf(branches)).toEqual(branches);
  for (const branch of branches) {
    expect(treeFromLeavesOf(branch)).toEqual(branch);
  }
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

function treeFromLeavesOf<T>(tree: T) {
  return toTree(toLeaves(tree));
}
