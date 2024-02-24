import _ from 'lodash';
import { expect, test, describe, beforeEach } from 'vitest';
import { undo } from '../changes.js';
import { Changes } from '../Changeable.js';
import Fragment from '../../types/Fragment.js';
import LeafPath from '../../types/LeafPath.js';

type A = { prop: string; leavemealone: boolean; other: number };
let source: A, sourceChest: Changes<A>;
let target: A, targetChest: Changes<A>;

beforeEach(() => {
  source = {
    prop: 'prop',
    other: 42,
    leavemealone: true,
  };
  target = _.cloneDeep(source);
  sourceChest = new Changes(source);
  targetChest = new Changes(target);
});

describe('undo()', () => {
  let originals: Fragment<A>;
  beforeEach(() => {
    originals = { prop: '', other: 0 };
    sourceChest.original = { ...originals };
    targetChest.original = { ...originals };
  });

  test('proposes reverting back to original values', () => {
    undo(target, Object.keys(originals) as LeafPath<typeof target>[]);
    expect(targetChest.proposed).toEqual({
      ...sourceChest.proposed,
      ...originals,
    });
  });
});
