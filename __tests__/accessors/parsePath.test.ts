import { test, expect } from 'vitest';
import parsePath from '../../utils/parsePath.js';

test('empty indices', () => {
  expect(parsePath('a[][][]')).toEqual(parsePath('a[0][0][0]'));
});
