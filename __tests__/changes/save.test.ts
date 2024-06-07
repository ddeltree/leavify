import { expect, test, beforeEach, describe } from 'vitest';
import { cloneDeepAsOriginal, save } from '@changes/changes.js';
import {
  VAL,
  resetInitialValues,
  mockOriginals,
  mockProposal,
} from './mocking.js';
import _ from 'lodash';

describe('asOriginal()', () => {
  beforeEach(() => {
    resetInitialValues();
    mockOriginals();
  });

  test("applies the existent symbol's entries", () => {
    VAL.sourceChanges.removeStore();
    expect(cloneDeepAsOriginal(VAL.target)).toEqual({
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
    expect(_.isEmpty(VAL.targetChanges.proposed)).not.toBe(true);
    save(VAL.target);
    expect(_.isEmpty(VAL.targetChanges.proposed)).toBe(true);
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
    expect(VAL.targetChanges.original).toEqual({});
  });

  test('affects none but the proposed fields', () => {
    save(VAL.target);
    VAL.targetChanges.removeStore(), VAL.sourceChanges.removeStore();
    expect({ ...VAL.target }).toEqual({
      ...VAL.source,
      ...VAL.sourceChanges.proposed,
    });
  });
});
