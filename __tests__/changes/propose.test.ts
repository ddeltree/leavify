import { expect, test, describe, beforeEach } from 'vitest';
import { propose } from '@changes/changes.js';
import { LeafPath, Primitive } from '@typings';
import toTree from '@accessors/toTree.js';
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
    VAL.targetChanges.removeStore();
    VAL.sourceChanges.removeStore();
    expect(VAL.target).toEqual(VAL.source);
  });
});
