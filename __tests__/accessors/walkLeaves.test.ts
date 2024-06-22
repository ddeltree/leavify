import { test, expect, describe } from 'vitest';
import walkLeaves from '@accessors/walkLeaves.js';
import toTree from '@accessors/toTree.js';
import { generateBranches } from './helpers.js';

describe('reversing walkLeaves', () => {
  test('empty array argument', () => {
    expect(treeFromLeavesOf([])).toBe(undefined);
  });

  test('empty object argument', () => {
    expect(treeFromLeavesOf({})).toBe(undefined);
  });

  test('nesting combinations up to level 5', () => {
    const branches = generateBranches();
    expect(treeFromLeavesOf(branches)).toEqual(branches);
    for (const branch of branches) {
      expect(treeFromLeavesOf(branch)).toEqual(branch);
    }
  });
});

describe('walkLeaves', () => {
  test('returns single value for proper branch inputs', () => {
    const branches = generateBranches();
    for (const branch of branches)
      expect([...walkLeaves(branch)].length).toBe(1);
  });

  test('returns empty for branches with no leaf values', () => {
    const branches = generateBranches({ withLeaf: false });
    for (const branch of branches)
      expect(walkLeaves(branch).next().done).toBe(true);
  });

  test('ignores circular references', () => {
    interface A {
      value_A: 'a';
      B?: B;
    }
    interface B {
      value_b: 'b';
      A: A;
    }

    const a: A = {
      value_A: 'a',
    };
    const b: B = {
      A: a,
      value_b: 'b',
    };
    a['B'] = b;
    expect([...walkLeaves(a)]).toEqual([
      ['value_A', 'a'],
      ['B.value_b', 'b'],
    ]);
  });
});

function treeFromLeavesOf<T extends object>(tree: T) {
  const elems = [...walkLeaves(tree)].map(([p, v]) => [p, v] as const);
  return toTree(elems);
}
