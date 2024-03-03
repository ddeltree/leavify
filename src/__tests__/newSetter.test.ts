/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from 'vitest';
import {
  buildRefs,
  getBindingRefMap,
  hasTypeCollision,
  reconstruct,
} from '../newSetter.js';
import { split } from '../parsePath.js';

test('only root key', () => {
  // const dotPath = split('a')[0];
  // const ref = {};

  const ref1: any[] = [2];
  const dotPath1 = split('a[][][][42]')[0];

  console.log(getBindingRefMap(ref1, dotPath1));
  // console.log(buildRefs(ref1, dotPath1));
  // console.log(reconstruct(ref1, dotPath1));
  // expect(hasTypeCollision(getBindingRefMap(ref1, dotPath1), dotPath1)).toBe(
  //   true,
  // );

  // expect(dottedPathToTree(ref, dotPath)).toEqual({
  //   a: {},
  // });
});

// test('only array index', () => {
//   const dotPath = split('[0]')[0];
//   const ref = [] as unknown[];
//   expect(dottedPathToTree(ref, dotPath)).toEqual([{}]);
// });
