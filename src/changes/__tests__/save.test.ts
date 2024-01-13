import { expect, test, beforeEach, describe } from 'vitest';
import { Changeable, asOriginal, save } from '../changes.js';
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

describe('asOriginal()', () => {
  test('applies either _original or keeps current field', () => {
    expect(asOriginal(source)).toEqual({
      prop: source._original?.prop ?? source.prop,
      other: source._original?.other ?? source.other,
      leavemealone: source._original?.leavemealone ?? source.leavemealone,
    } as A);
  });
});

describe('save()', () => {
  test('empties the _unsaved field and applies', () => {
    save(target);
    expect(target).toEqual({
      prop: source._unsaved!.prop,
      other: source.other,
      leavemealone: source.leavemealone,
      _original: source._original,
      _unsaved: {},
    } as A);
  });
});
