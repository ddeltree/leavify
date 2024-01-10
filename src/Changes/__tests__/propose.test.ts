import { expect, test } from 'vitest';
import { Changeable, propose } from '../experimenting';
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
};

test('propose', () => {
  const kase = _.cloneDeep(base);
  const proposition = { prop: 'proposed', other: 2 } as A;
  propose(kase, proposition);
  expect(kase).toEqual({
    ...kase,
    _unsaved: proposition,
  });
});
