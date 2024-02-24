import { expect, test, describe, beforeEach } from 'vitest';
import { undo } from '../changes.js';
import LeafPath from '../../types/LeafPath.js';
import { initialValues } from './helpers.js';

describe('undo()', () => {
  using values = initialValues();
  const { sourceChanges, target, targetChanges, originals, mockOriginals } =
    values;
  beforeEach(mockOriginals);

  test('proposes reverting back to original values', () => {
    undo(target, Object.keys(originals) as LeafPath<typeof target>[]);
    expect(targetChanges.proposed).toEqual({
      ...sourceChanges.proposed,
      ...originals,
    });
  });
});
