import { expect, test, beforeEach, describe } from 'vitest';
import { asOriginal, save } from '../changes.js';
import { initialValues } from './helpers.js';

describe('asOriginal()', () => {
  using values = initialValues();
  const { source, sourceChanges, target, mockOriginals } = values;
  beforeEach(mockOriginals);

  test("applies the existent symbol's entries", () => {
    sourceChanges.removeChest();
    expect(asOriginal(target)).toEqual({
      ...source,
      ...sourceChanges.original,
    });
  });
});

// describe('save()', () => {
//   let proposal: {
//     prop: string;
//   };
//   beforeEach(() => {
//     proposal = {
//       prop: 'new',
//     };
//     const originals = {
//       prop: 'original',
//       other: 43,
//     };
//     sourceChanges.proposed = { ...proposal };
//     targetChanges.proposed = { ...proposal };
//     sourceChanges.original = { ...originals };
//     targetChanges.original = { ...originals };
//   });

//   test('empties the proposals list', () => {
//     save(target);
//     expect(targetChanges.proposed).toEqual({});
//   });

//   test('non-original value proposal does not affect the stored original values', () => {
//     save(target);
//     expect(targetChanges.original).toEqual(sourceChanges.original);
//   });

//   test('original value proposal empties the stored original field', () => {
//     const proposal = sourceChanges.original;
//     sourceChanges.proposed = { ...proposal };
//     targetChanges.proposed = { ...proposal };
//     save(target);
//     expect(targetChanges.proposed).toEqual({});
//   });

//   test('affects none but the proposed fields', () => {
//     save(target);
//     delete target[CHANGES_SYMBOL], delete source[CHANGES_SYMBOL];
//     expect({ ...target }).toEqual({ ...source, ...proposal });
//   });
// });
