import { expect, test, describe, beforeEach } from 'vitest';
import { Changeable, undo } from '../changes';
import _ from 'lodash';

type A = { prop: string; leavemealone: boolean; other: number };
let base: Changeable<A>;

beforeEach(() => {
  base = {
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
});

describe('undo', () => {
  test('proposes reverting back to original', () => {
    const kase = _.cloneDeep(base);
    undo(kase, { prop: '' });
    expect(kase).toEqual({
      ...kase,
      _unsaved: {
        ...base._unsaved,
        prop: base._original?.prop ?? base.prop,
      },
    });
  });
});
