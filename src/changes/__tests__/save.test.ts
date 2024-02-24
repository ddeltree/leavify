import { expect, test, beforeEach, describe } from 'vitest';
import { asOriginal, save } from '../changes.js';
import {
  VAL,
  resetInitialValues,
  mockOriginals,
  mockProposal,
} from './mocking.js';

describe('asOriginal()', () => {
  beforeEach(() => {
    resetInitialValues();
    mockOriginals();
  });

  test("applies the existent symbol's entries", () => {
    VAL.sourceChanges.removeChest();
    expect(asOriginal(VAL.target)).toEqual({
      ...VAL.source,
      ...VAL.sourceChanges.original,
    });
  });
});

describe('save()', () => {
  beforeEach(() => {
    resetInitialValues();
    mockOriginals();
    mockProposal();
  });

  test('empties the proposals list', () => {
    save(VAL.target);
    expect(VAL.targetChanges.proposed).toEqual({});
  });

  test('non-original value proposal does not affect the stored original values', () => {
    save(VAL.target);
    expect(VAL.targetChanges.original).toEqual(VAL.sourceChanges.original);
  });

  test('original value proposal empties the stored original field', () => {
    const proposal = VAL.sourceChanges.original;
    VAL.sourceChanges.proposed = { ...proposal };
    VAL.targetChanges.proposed = { ...proposal };
    save(VAL.target);
    expect(VAL.targetChanges.proposed).toEqual({});
  });

  test('affects none but the proposed fields', () => {
    save(VAL.target);
    VAL.targetChanges.removeChest(), VAL.sourceChanges.removeChest();
    expect({ ...VAL.target }).toEqual({
      ...VAL.source,
      ...VAL.sourceChanges.proposed,
    });
  });
});
