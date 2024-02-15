import { expect, test, describe, beforeEach } from 'vitest';
import { propose } from '../changes.js';
import _ from 'lodash';
import { Changeable, CHANGES_SYMBOL } from '../Changeable.js';
import LeafPath from '../../types/NewLeafPath.js';
import { Primitive } from '../../types/Leaves.js';
import toTree from '../../toTree.js';

type A = { prop: string; leavemealone: boolean; other: number };
let source: Changeable<A>;
let target: Changeable<A>;

beforeEach(() => {
  source = {
    prop: 'saved',
    other: 42,
    leavemealone: true,
    [CHANGES_SYMBOL]: {
      original: {
        prop: 'original',
        other: 43,
      },
      proposed: {},
    },
  };
  target = _.cloneDeep(source);
});

describe('propose', () => {
  let proposal: [LeafPath<A>, Primitive][];
  beforeEach(() => {
    proposal = [
      ['prop', '2'],
      ['other', 2],
    ];
  });

  test('new proposal exists', () => {
    propose(target, proposal);
    expect(target[CHANGES_SYMBOL]?.proposed).toEqual(toTree(proposal));
  });

  test('new proposal does not affect saved values', () => {
    propose(target, proposal);
    delete target[CHANGES_SYMBOL];
    delete source[CHANGES_SYMBOL];
    expect(target).toEqual(source);
  });
});
