import { expect, test } from 'vitest';
import { Changeable, undo } from '../experimenting';
import _ from 'lodash';

type A = { prop: string; leavemealone: boolean; other: number };
const base: Changeable<A> = {
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

test('undo proposes reverting back to original', () => {
  const kase = _.cloneDeep(base);
  undo(kase, { prop: '' });
  console.log(kase);
  expect(kase).toEqual({
    ...kase,
    _unsaved: {
      ...base._unsaved,
      prop: base._original?.prop ?? base.prop,
    },
  });
});
