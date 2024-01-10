import { expect, test } from 'vitest';
import { Changeable, asOriginal, save } from '../experimenting.js';
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

test('originals', () => {
  const kase = _.cloneDeep(base);
  expect(asOriginal(kase)).toEqual({
    prop: base._original?.prop ?? base.prop,
    other: base._original?.other ?? base.other,
    leavemealone: base._original?.leavemealone ?? base.leavemealone,
  } as A);
});

test('change a single property', () => {
  const obj = _.cloneDeep(base);
  save(obj);
  expect(obj).toEqual({
    prop: base._unsaved!.prop,
    other: base.other,
    leavemealone: base.leavemealone,
    _original: base._original,
    _unsaved: {},
  });
});
