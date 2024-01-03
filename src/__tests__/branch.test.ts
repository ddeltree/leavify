import { test, expect } from 'vitest';
import Branch, { fromBranch } from '../Branch';

test('basic branch case', () => {
  const tree = {
    a: {
      b: [
        [
          {
            c: 42,
          },
        ],
      ],
    },
  };
  const branch: Branch<typeof tree> = tree; // this tree is a branch
  expect(fromBranch(branch)).toEqual(['a.b[0][0].c', 42]);
});

test('a tree is not a branch', () => {
  const tree = {
    a: 42,
    b: {
      c: 13,
    },
  };
  expect(() => new Branch(tree)).toThrowError();
});
