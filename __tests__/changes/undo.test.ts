import { expect, test, describe, beforeEach } from 'vitest';
import { undo } from '@changes/changes.js';
import { LeafPath } from '@typings';
import { VAL, mockOriginals, resetInitialValues } from './mocking.js';

describe('undo()', () => {
  beforeEach(() => {
    resetInitialValues();
    mockOriginals();
  });

  test('proposes reverting back to original values', () => {
    undo(
      VAL.target,
      Object.keys(VAL.sourceChanges.original) as LeafPath<typeof VAL.target>[],
    );
    expect(VAL.targetChanges.proposed).toEqual({
      ...VAL.sourceChanges.proposed,
      ...VAL.sourceChanges.original,
    });
  });
});
