import { expect, test, describe, beforeEach } from 'vitest';
import { propose } from '../../src/changes/changes.js';
import LeafPath from '../../src/types/LeafPath.js';
import { Primitive } from '../../src/types/Leaves.js';
import toTree from '../../src/accessors/toTree.js';
import { TestCase, VAL, mockOriginals, resetInitialValues } from './mocking.js';

beforeEach(() => {
  resetInitialValues();
  mockOriginals();
});

describe('propose', () => {
  let proposal: [LeafPath<TestCase>, Primitive][];
  beforeEach(() => {
    proposal = [
      ['prop', '2'],
      ['other', 2],
    ];
  });

  test('new proposal exists', () => {
    propose(VAL.target, proposal);
    expect(VAL.targetChanges.proposed).toEqual(toTree(proposal));
  });

  test('new proposal does not affect saved values', () => {
    propose(VAL.target, proposal);
    VAL.targetChanges.removeChest();
    VAL.sourceChanges.removeChest();
    expect(VAL.target).toEqual(VAL.source);
  });
});
