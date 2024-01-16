import { expect, test, describe, beforeEach } from 'vitest';
import { propose } from '../changes';
import _ from 'lodash';
import { Changeable, CHANGES_SYMBOL } from '../Changeable';

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
  test('...', () => {
    const proposal = { prop: 'proposed', other: 2 } as A;
    propose(target, proposal);
    expect(target).toEqual({
      ...target,
      _unsaved: proposal,
    });
  });
});
