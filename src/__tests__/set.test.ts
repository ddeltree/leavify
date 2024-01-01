import _ from 'lodash';
import { test, expect } from 'vitest';
import { set, get } from '../properties';
import { bitWordToBranch } from './helpers';

test('change leaf of branch', () => {
  const branch = bitWordToBranch('1001', true);
  const path = '[0].0.0[0]',
    value = 42;
  expect(get(branch, path)).not.toBe(value);
  set(branch, path, value);
  expect(get(branch, path)).toBe(value);
});

test('change existent value and preserve previous ones', () => {
  const tree = {
    a: 'a',
    b: { c: 'c', d: {} },
    c: [{ e: [] }, [2]],
    change: [0, 2, { target: 42 }],
  };
  const copy = _.cloneDeep(tree);
  const path = 'change[2].target',
    value = 13;
  // set new value
  set(tree, path, value);
  expect(get(tree, path)).toBe(value);
  // check that the previous values remain
  for (const key of Object.keys(tree)) {
    const k = key as keyof typeof tree;
    if (k === 'change') continue;
    expect(tree[k]).toEqual(copy[k]);
  }
});

test('create branch to inexistent path', () => {
  const branch = bitWordToBranch('1001');
  const path = 'some.inexistent[2].path',
    value = 42;
  expect(get(branch, path)).toEqual({});
  set(branch, path, value);
  expect(get(branch, path)).toBe(value);
});
