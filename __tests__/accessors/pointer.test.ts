import { test, expect, describe } from 'vitest';
import { fromPointer, toPointer } from '@accessors/pointer.js';
import { errorsIn } from '../types/languageService.js';

/** `pointer.ts` and `PointerString.ts` are two implementations of one
 * conversion — one in JavaScript, one in the type system. The tables below feed
 * both, so neither half can drift without a test going red. */

const TO_POINTER: [path: string, pointer: string][] = [
  ['flat', '/flat'],
  ['a.b.c', '/a/b/c'],
  ['items[0].sku', '/items/0/sku'],
  ['matrix[1][2]', '/matrix/1/2'],
  ['[0].id', '/0/id'],
  // `[]` is shorthand for `[0]`, so this one normalises rather than round-trips
  ['values[]', '/values/0'],
  // '/' is ordinary in a leavify path and reserved in a pointer; '~' likewise
  ['a/b', '/a~1b'],
  ['a~b', '/a~0b'],
  // leavify escapes are structural here and meaningless there, so they drop
  ['a\\.b', '/a.b'],
  ['a\\[0\\]', '/a[0]'],
  ['a.-1', '/a/-1'],
];

const FROM_POINTER: [pointer: string, path: string][] = [
  ['/flat', 'flat'],
  ['/a/b/c', 'a.b.c'],
  ['/items/0/sku', 'items[0].sku'],
  ['/matrix/1/2', 'matrix[1][2]'],
  ['/0/id', '[0].id'],
  ['/a~1b', 'a/b'],
  ['/a~0b', 'a~b'],
  // an array index is digits only: `-1` and `5x` are ordinary keys, and the
  // type-level twin has to agree, which `` `${number}` `` would not
  ['/a/-1', 'a.-1'],
  ['/a/5x', 'a.5x'],
  // and back: what is structural in a path has to be escaped on the way in
  ['/a.b', 'a\\.b'],
  ['/a[0]', 'a\\[0\\]'],
  // the empty pointer refers to the whole document
  ['', ''],
];

describe('toPointer()', () => {
  test.each(TO_POINTER)('%s -> %s', (path, pointer) => {
    expect(toPointer(path)).toBe(pointer);
  });
});

describe('fromPointer()', () => {
  test.each(FROM_POINTER)('%s -> %s', (pointer, path) => {
    expect(fromPointer(pointer)).toBe(path);
  });

  test('rejects a pointer that does not start with a slash', () => {
    expect(() => fromPointer('a/b')).toThrow(/must start with/);
  });
});

describe('round trip', () => {
  // `values[]` is excluded: `[]` normalises to `[0]`, so the first pass rewrites
  // the path and every pass after it is stable. That is the grammar working,
  // not a lossy conversion.
  test('the `[]` shorthand normalises on the way through', () => {
    expect(fromPointer(toPointer('values[]'))).toBe('values[0]');
    expect(fromPointer(toPointer('values[0]'))).toBe('values[0]');
  });

  test.each(TO_POINTER.map(([path]) => path).filter((p) => p !== 'values[]'))(
    '%s survives path -> pointer -> path',
    (path) => {
      expect(fromPointer(toPointer(path))).toBe(path);
    },
  );

  test.each(FROM_POINTER.filter(([ptr]) => ptr !== '').map(([ptr]) => ptr))(
    '%s survives pointer -> path -> pointer',
    (pointer) => {
      expect(toPointer(fromPointer(pointer))).toBe(pointer);
    },
  );
});

/** A string literal as it has to be spelled inside generated TypeScript source:
 * a backslash in the value is two in the snippet. */
const lit = (value: string) => `'${value.replaceAll('\\', '\\\\')}'`;

const PRELUDE = `import { toPointer, fromPointer } from '@accessors';\n`;

describe('the conversion holds at the type level, on the same table', () => {
  const assertions = (suffix = '') => [
    ...TO_POINTER.map(
      ([path, pointer], i) =>
        `const a${i}: ${lit(pointer + suffix)} = toPointer(${lit(path)});`,
    ),
    ...FROM_POINTER.map(
      ([pointer, path], i) =>
        `const b${i}: ${lit(path + suffix)} = fromPointer(${lit(pointer)});`,
    ),
  ];

  test('every case resolves to the literal the runtime produces', () => {
    expect(errorsIn(PRELUDE + assertions().join('\n'))).toEqual([]);
  });

  test('and a wrong expectation fails, so the check above is not vacuous', () => {
    // Without this, a conversion that resolved to `never` would satisfy every
    // assertion above — `never` is assignable to anything.
    const errors = errorsIn(PRELUDE + assertions('~X').join('\n'));
    expect(errors).toHaveLength(TO_POINTER.length + FROM_POINTER.length);
  });

  test('a path that is not a literal widens to string instead of breaking', () => {
    expect(
      errorsIn(`${PRELUDE}
        declare const dynamic: string;
        declare const interpolated: \`items[\${number}].sku\`;
        const a: string = toPointer(dynamic);
        const b: string = toPointer(interpolated);
        const c: string = fromPointer(dynamic);
      `),
    ).toEqual([]);
  });

  test('a union of paths converts to the union of pointers', () => {
    expect(
      errorsIn(`${PRELUDE}
        declare const path: 'a.b' | 'items[0].sku';
        const p: '/a/b' | '/items/0/sku' = toPointer(path);
      `),
    ).toEqual([]);
  });
});
