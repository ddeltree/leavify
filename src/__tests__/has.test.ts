import { test, expect } from 'vitest';
import { has } from '../accessors';

test('indexing leaf string value', () => {
  const value = {
    hello: 'world',
  };
  expect(has(value, 'hello[2]')).toBe(false);
  expect(has(value, 'hello')).toBe(true);
});

test('non leaf value', () => {
  const ob = {
    hello: { zero: 'leaf', one: {}, two: [] },
    world: ['leaf', {}, []],
  };
  expect(has(ob, 'hello')).toBe(false);
  expect(has(ob, 'hello.zero')).toBe(true);
  expect(has(ob, 'hello.one')).toBe(false);
  expect(has(ob, 'hello.two')).toBe(false);

  expect(has(ob, 'world')).toBe(false);
  expect(has(ob, 'world[0]')).toBe(true);
  expect(has(ob, 'world[1]')).toBe(false);
  expect(has(ob, 'world[2]')).toBe(false);
});
