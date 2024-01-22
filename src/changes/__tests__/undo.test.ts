import { expect, test, describe, beforeEach } from 'vitest';
import { undo } from '../changes';
import _ from 'lodash';
import { CHANGES_SYMBOL, Changeable } from '../Changeable';
import Fragment from '../../types/Fragment';

type A = { prop: string; leavemealone: boolean; other: number };
type Changes = Pick<
  Changeable<A>,
  typeof CHANGES_SYMBOL
>[typeof CHANGES_SYMBOL];
type Defined<T> = T extends undefined ? never : T;
let source: Changeable<A>, sourceChanges: Defined<Changes>;
let target: Changeable<A>, targetChanges: Defined<Changes>;

beforeEach(() => {
  source = {
    prop: 'prop',
    other: 42,
    leavemealone: true,

    [CHANGES_SYMBOL]: {
      original: {},
      proposed: {},
    },
  };
  target = _.cloneDeep(source);
  sourceChanges = source[CHANGES_SYMBOL]!;
  targetChanges = target[CHANGES_SYMBOL]!;
});

describe('undo()', () => {
  let originals: Fragment<A>;
  beforeEach(() => {
    originals = { prop: '', other: 0 };
    sourceChanges.original = { ...originals };
    targetChanges.original = { ...originals };
  });

  test('proposes reverting back to original values', () => {
    undo(target, Object.keys(originals));
    expect(targetChanges.proposed).toEqual({
      ...sourceChanges.proposed,
      ...originals,
    });
  });
});
