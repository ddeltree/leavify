/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from 'vitest';
import { getBindings, isNoCollisionSubPath } from '../newSetter.js';
import { split } from '../parsePath.js';

test('only root key', () => {
  const ref1: any = { a: [2, [2]] };
  const dotPath1 = split('a[1][1]')[0];

  console.log(getBindings(ref1, dotPath1));
  expect(isNoCollisionSubPath(ref1, dotPath1)).toBe(true);
});

// test('only array index', () => {
//   const dotPath = split('[0]')[0];
//   const ref = [] as unknown[];
//   expect(dottedPathToTree(ref, dotPath)).toEqual([{}]);
// });
