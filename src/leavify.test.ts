import _ from 'lodash';
import { toLeaves, toTree } from './leavify';
import {} from 'jest';

test('empty array', () => {
  expect(is_tree_equal_leavesToTree([])).toBe(false);
});

test('empty object', () => {
  expect(is_tree_equal_leavesToTree({})).toBe(false);
});

test('nesting combinations up to level 5', () => {
  const branches = generateBranches();
  expect(is_tree_equal_leavesToTree(branches)).toBe(true);
  for (const branch of branches)
    expect(is_tree_equal_leavesToTree(branch)).toBe(true);
});

function is_tree_equal_leavesToTree<T>(tree: T) {
  const inversed = toTree(toLeaves(tree));
  return str(tree) === str(inversed);
}

function generateBranches() {
  const branches: any[] = [];
  _.range(2, 5).forEach((digitCount) =>
    _.range(0, 2 ** digitCount).forEach((value) => {
      // 010 --> {0: [{}]}
      const bits = value.toString(2);
      const bitArr = '0'.repeat(digitCount - bits.length) + bits;
      const arrDict: ({} | [])[] = _.map(bitArr, (bit) =>
        bit === '0' ? {} : [],
      );
      const branch = arrDict.reduce((prev, curr) => {
        if (prev === null) return curr;
        const res: any = curr;
        res[0] = prev;
        return res;
      }, null as any);
      branches.push(branch);
    }),
  );
  return branches;
}

const str = (v: any) => JSON.stringify(v, null, 0);
