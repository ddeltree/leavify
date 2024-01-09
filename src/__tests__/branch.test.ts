import { test, expect } from 'vitest';
import Branch from '../Branch';
import fromBranch from '../fromBranch';

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
  // TODO expect(fromBranch(branch)).toEqual(['a.b[0][0].c', 42]);
});

test('a tree is not a branch', () => {
  const tree = {
    a: 42,
    b: {
      c: 13,
    },
  };
  expect(() => fromBranch(tree)).toThrowError(
    'Expected a branch of single leaf',
  );
});
