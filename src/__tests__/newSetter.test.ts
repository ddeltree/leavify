/* eslint-disable  */
import { test, expect } from 'vitest';
import {
  createMissingRefs,
  getBindings,
  hasTypeCollision,
} from '../newSetter.js';
import { split } from '../parsePath.js';
import LeafPath from '../types/LeafPath.js';

test('only root key', () => {
  const ref1 = { a: [2, [2]] } as const;
  // console.log(getBindings(ref1, dotPath1));

  const isValid = (path: (string & {}) | LeafPath<typeof ref1>) =>
    hasTypeCollision(ref1 as any, getBindings(ref1, split(path)[0]));
  const createMissing = (path: (string & {}) | LeafPath<typeof ref1>) =>
    createMissingRefs(getBindings(ref1, split(path)[0]));
  console.log(createMissing('a[0][]'));
  expect(() => isValid('')).toThrowError();
  expect(isValid('other key')).toBe(true);
  expect(isValid('a')).toBe(false);
  expect(isValid('a[]')).toBe(true);
  expect(isValid('a[][]')).toBe(false);
  expect(isValid('a[1][]')).toBe(true);
  expect(isValid('a[1][1]')).toBe(true);
  expect(isValid('a[2]')).toBe(true);
  expect(isValid('a[2][][42]')).toBe(true);
});

// test('only array index', () => {
//   const dotPath = split('[0]')[0];
//   const ref = [] as unknown[];
//   expect(dottedPathToTree(ref, dotPath)).toEqual([{}]);
// });
