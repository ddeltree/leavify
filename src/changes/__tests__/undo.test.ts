import { expect, test, describe, beforeEach } from 'vitest';
import { Changeable, undo } from '../changes';
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
    _unsaved: {
      prop: 'proposed',
    },
  };
  target = _.cloneDeep(source);
});

describe('undo', () => {
  test('proposes reverting back to original', () => {
    undo(target, { prop: '', other: 22 });
    expect(target).toEqual({
      ...target,
      _unsaved: {
        ...source._unsaved,
        prop: source._original?.prop ?? source.prop,
        other: source._original?.other ?? source.other,
      },
    });
  });
});
