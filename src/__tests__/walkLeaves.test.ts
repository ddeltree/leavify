import _ from 'lodash';
import { test, expect } from 'vitest';
import walkLeaves from '../walkLeaves';
import toTree from '../toTree';
import { generateBranches } from './helpers';

test('reversing walkLeaves for empty array argument', () => {
  expect(treeFromLeavesOf([])).toBe(undefined);
});

test('reversing walkLeaves for empty object argument', () => {
  expect(treeFromLeavesOf({})).toBe(undefined);
});

test('reversing walkLeaves for all nesting combinations up to level 5', () => {
  const branches = generateBranches();
  expect(treeFromLeavesOf(branches)).toEqual(branches);
  for (const branch of branches) {
    expect(treeFromLeavesOf(branch)).toEqual(branch);
  }
});

test('walkLeaves returns single value for proper branch inputs', () => {
  const branches = generateBranches();
  for (const branch of branches) expect([...walkLeaves(branch)].length).toBe(1);
});

test('walkLeaves returns empty for branches with no leaf values', () => {
  const branches = generateBranches({ withLeaf: false });
  for (const branch of branches)
    expect(walkLeaves(branch).next().done).toBe(true);
});

function treeFromLeavesOf(tree: object) {
  return toTree(walkLeaves(tree));
}
