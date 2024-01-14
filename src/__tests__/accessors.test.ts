import _ from 'lodash';
import { test, expect, describe } from 'vitest';
import { set, get, has } from '../accessors';
import { bitWordToBranch } from './helpers';

// if this fails, get() will also
describe('has()', () => {
  const ob = {
    leaf: 'value',
    obj: { leaf: 'value', obj: {}, arr: [] },
    arr: ['value', {}, []],
  };

  test('leaf values return true', () => {
    expect(has(ob, 'leaf')).toBe(true);
    expect(has(ob, 'obj.leaf')).toBe(true);
    expect(has(ob, 'arr[0]')).toBe(true);
  });

  test('non leaf value returns false', () => {
    expect(has(ob, 'obj')).toBe(false);
    expect(has(ob, 'obj.obj')).toBe(false);
    expect(has(ob, 'obj.arr')).toBe(false);
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
    expect(() => get(branch, path)).toThrow();
    set(branch, path, value);
    expect(get(branch, path)).toBe(value);
  });
});
