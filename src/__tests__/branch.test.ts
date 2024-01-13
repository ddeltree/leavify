import { test, expect, describe } from 'vitest';
import fromBranch from '../fromBranch';

describe('fromBranch()', () => {
  const branch = {
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
  const tree = {
    a: 42,
    b: {
      c: 13,
    },
  };

  test('basic branch case', () => {
    expect(fromBranch(branch)).toEqual([
      'a.b[0][0].c',
      42,
      [
        { name: 'a', isArrayIndex: false },
        { name: 'b', isArrayIndex: false },
        { name: '0', isArrayIndex: true },
        { name: '0', isArrayIndex: true },
        { name: 'c', isArrayIndex: false },
      ],
    ]);
  });

  test('a tree is not a branch', () => {
    expect(() => fromBranch(tree)).toThrowError(
      'Expected a branch of single leaf',
    );
  });
});
