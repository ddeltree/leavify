import { test, expect, describe } from 'vitest';
import { fromPointer, toPointer } from '@accessors/pointer.js';

describe('toPointer()', () => {
  test.each([
    ['flat', '/flat'],
    ['a.b.c', '/a/b/c'],
    ['items[0].sku', '/items/0/sku'],
    ['matrix[1][2]', '/matrix/1/2'],
    ['[0].id', '/0/id'],
  ])('%s -> %s', (path, pointer) => {
    expect(toPointer(path)).toBe(pointer);
  });

  test('escapes RFC 6901 reserved characters', () => {
    // '/' is an ordinary character in a leavify path, reserved in a pointer
    expect(toPointer('a/b')).toBe('/a~1b');
    expect(toPointer('a~b')).toBe('/a~0b');
  });

  test('drops leavify escapes, which the pointer does not need', () => {
    expect(toPointer('a\\.b')).toBe('/a.b');
    expect(toPointer('a\\[0\\]')).toBe('/a[0]');
  });
});

describe('fromPointer()', () => {
  test.each([
    ['/flat', 'flat'],
    ['/a/b/c', 'a.b.c'],
    ['/items/0/sku', 'items[0].sku'],
    ['/matrix/1/2', 'matrix[1][2]'],
    ['/0/id', '[0].id'],
  ])('%s -> %s', (pointer, path) => {
    expect(fromPointer(pointer)).toBe(path);
  });

  test('unescapes RFC 6901 reserved characters', () => {
    expect(fromPointer('/a~1b')).toBe('a/b');
    expect(fromPointer('/a~0b')).toBe('a~b');
  });

  test('escapes characters that are structural in a leavify path', () => {
    expect(fromPointer('/a.b')).toBe('a\\.b');
    expect(fromPointer('/a[0]')).toBe('a\\[0\\]');
  });

  test('the empty pointer refers to the whole document', () => {
    expect(fromPointer('')).toBe('');
  });

  test('rejects a pointer that does not start with a slash', () => {
    expect(() => fromPointer('a/b')).toThrow(/must start with/);
  });
});

describe('round trip', () => {
  test.each(['flat', 'a.b.c', 'items[0].sku', 'matrix[1][2]', '[0].id'])(
    '%s survives path -> pointer -> path',
    (path) => {
      expect(fromPointer(toPointer(path))).toBe(path);
    },
  );

  test.each(['/flat', '/a/b/c', '/items/0/sku', '/0/id'])(
    '%s survives pointer -> path -> pointer',
    (pointer) => {
      expect(toPointer(fromPointer(pointer))).toBe(pointer);
    },
  );
});
