/* eslint-disable @typescript-eslint/ban-ts-comment */
import _ from 'lodash';
import { test, expect, describe } from 'vitest';
import { set, get, has } from '../accessors.js';
import { bitWordToBranch } from './helpers.js';

// if this fails, get() will also
describe('has()', () => {
  const ob = {
    leaf: 'value',
    obj: {
      leaf: 'value',
      obj: {} as Record<string, unknown>,
      arr: [] as unknown[],
    },
    arr: ['value', {} as Record<string, unknown>, [] as unknown[]],
  };
  test('leaf values return true', () => {
    expect(has(ob, 'leaf')).toBe(true);
    expect(has(ob, 'obj.leaf')).toBe(true);
    expect(has(ob, 'arr[0]')).toBe(true);
  });

  test('non leaf value returns false', () => {
    // @ts-expect-error
    expect(has(ob, 'obj')).toBe(false);
    // @ts-expect-error
    expect(has(ob, 'obj.obj')).toBe(false);
    // @ts-expect-error
    expect(has(ob, 'obj.arr')).toBe(false);
    // @ts-expect-error
    expect(has(ob, 'arr')).toBe(false);
    expect(has(ob, 'arr[1]')).toBe(false);
    expect(has(ob, 'arr[2]')).toBe(false);
  });

  test('nesting combinations up to level 5', () => {});
});

// has() is already used by get()'s implemetation
describe('get(), has(), set() integration', () => {
  test('change leaf of branch', () => {
    const branch = bitWordToBranch('1001');
    const path = '[0].0.0[0]',
      value = 42;
    // @ts-expect-error
    expect(get(branch, path)).not.toBe(value);
    set(branch, [path, value]);
    // @ts-expect-error
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
    set(tree, [path, value]);
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
    // @ts-expect-error
    expect(() => get(branch, path)).toThrow();
    set(branch, [path, value]);
    // @ts-expect-error
    expect(get(branch, path)).toBe(value);
  });
});

describe('empty brackets index notation', () => {
  const leaf = 2,
    newLeaf = 42;
  const branch = {
    a: [{ b: [leaf] }],
  };
  expect(has(branch, 'a[].b[]')).toBe(true);
  expect(get(branch, 'a[].b[]')).toBe(leaf);
  expect(() => set(branch, ['a[].b[]', newLeaf])).not.toThrowError();
  expect(get(branch, 'a[].b[]')).toBe(newLeaf);
});
