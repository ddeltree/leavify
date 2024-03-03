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

  const ref1: any = { a: [2] };
  const dotPath1 = split('a[]')[0];
  const bindingRefMap = getBindingRefMap(ref1, dotPath1);
  const isValidPath = !hasTypeCollision(bindingRefMap);
  console.log(bindingRefMap);
  expect(isValidPath).toBe(true);
  // console.log(buildRefs(ref1, dotPath1));
  // console.log(reconstruct(ref1, dotPath1));

  // expect(dottedPathToTree(ref, dotPath)).toEqual({
  //   a: {},
  // });
});

// test('only array index', () => {
//   const dotPath = split('[0]')[0];
//   const ref = [] as unknown[];
//   expect(dottedPathToTree(ref, dotPath)).toEqual([{}]);
// });
