import { expect, test, beforeEach, describe } from 'vitest';
import { asOriginal, save } from '../changes.js';
import _ from 'lodash';
import { Changeable, CHANGES_SYMBOL } from '../Changeable.js';

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

describe('asOriginal()', () => {
  beforeEach(() => {
    const originals = {
      prop: 'original',
      other: 43,
    };
    sourceChanges.original = { ...originals };
    targetChanges.original = { ...originals };
  });
  test("applies the existent symbol's entries", () => {
    delete source[CHANGES_SYMBOL];
    expect(asOriginal(target)).toEqual({
      ...source,
      ...sourceChanges.original,
    });
  });
});

describe('save()', () => {
  let proposal: {
    prop: string;
  };
  beforeEach(() => {
    proposal = {
      prop: 'new',
    };
    const originals = {
      prop: 'original',
      other: 43,
    };
    sourceChanges.proposed = { ...proposal };
    targetChanges.proposed = { ...proposal };
    sourceChanges.original = { ...originals };
    targetChanges.original = { ...originals };
  });

  test('empties the proposals list', () => {
    save(target);
    expect(targetChanges.proposed).toEqual({});
  });

  test('non-original value proposal does not affect the stored original values', () => {
    save(target);
    expect(targetChanges.original).toEqual(sourceChanges.original);
  });

  test('original value proposal empties the stored original field', () => {
    const proposal = sourceChanges.original;
    sourceChanges.proposed = { ...proposal };
    targetChanges.proposed = { ...proposal };
    save(target);
    expect(targetChanges.proposed).toEqual({});
  });

  test('affects none but the proposed fields', () => {
    save(target);
    delete target[CHANGES_SYMBOL], delete source[CHANGES_SYMBOL];
    expect({ ...target }).toEqual({ ...source, ...proposal });
  });
});
