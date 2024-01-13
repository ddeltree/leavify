import { expect, test, describe, beforeEach } from 'vitest';
import { Changeable, propose } from '../changes';
import _ from 'lodash';

type A = { prop: string; leavemealone: boolean; other: number };
let source: Changeable<A>;
let target: Changeable<A>;

beforeEach(() => {
  source = {
    prop: 'saved',
    other: 42,
    leavemealone: true,
    _original: {
      prop: 'original',
      other: 43,
    },
  };
  target = _.cloneDeep(source);
});

describe('propose', () => {
  test('...', () => {
    const proposition = { prop: 'proposed', other: 2 } as A;
    propose(target, proposition);
    expect(target).toEqual({
      ...target,
      _unsaved: proposition,
    });
  });
});
