/* eslint-disable  */
import { test, expect } from 'vitest';
import {
  createMissingRefs,
  getBindings,
  hasTypeCollision,
  strictReconstruct,
  looseReconstruct,
  setOutline,
} from '../newSetter.js';
import { split } from '../parsePath.js';
import LeafPath from '../types/LeafPath.js';

test('only root key', () => {
  const ref1 = { a: [2, [2]] } as const;
  // console.log(getBindings(ref1, dotPath1));

  const isValid = (path: (string & {}) | LeafPath<typeof ref1>) =>
    !hasTypeCollision(ref1 as any, getBindings(ref1, split(path)[0]));
  const buildStrict = (ob: any, path: (string & {}) | LeafPath<typeof ref1>) =>
    strictReconstruct(ob, split(path)[0]);
  const buildLoose = (ob: any, path: (string & {}) | LeafPath<typeof ref1>) =>
    looseReconstruct(ob, split(path)[0]);

  expect(() => buildStrict([], 'a')).toThrowError();
  expect(() => buildStrict({}, '[]')).toThrowError();
  expect(() => buildStrict({ a: [2] }, 'a')).toThrowError();
  expect(() => buildLoose({ a: [2] }, 'a')).not.toThrowError();

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

test('set', () => {
  const ob = {
    person: { nome: 'me', arr: [2, [33, [3]]] },
    numbers: [0, 1, 'str'],
  };
  expect(() => setOutline(ob, ['person.arr[0][]', 42])).toThrowError();
  expect(() => setOutline(ob, ['person.arr[100]', 42])).not.toThrowError();
  expect(() => setOutline(ob, ['person.arr[100][]', 42])).toThrowError();
});

// test('only array index', () => {
//   const dotPath = split('[0]')[0];
//   const ref = [] as unknown[];
//   expect(dottedPathToTree(ref, dotPath)).toEqual([{}]);
// });
