import { test, expect } from 'vitest';
import Branch from '../Branch';

test('basic branch case', () => {
  const branch = new Branch({
    a: {
      b: [
        [
          {
            c: 42,
          },
        ],
      ],
    },
  });
  expect(branch.asPathValue()).toEqual(['a.b[0][0].c', 42]);
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
