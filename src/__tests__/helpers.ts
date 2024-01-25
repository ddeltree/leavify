/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';

export function generateBranches(params?: { withLeaf: boolean }): object[] {
  const branches: object[] = [];
  _.range(2, 5).forEach((n) => {
    nBitWords(n).forEach((word) =>
      branches.push(bitWordToBranch(word, params?.withLeaf ?? true)),
    );
  });
  return branches;
}

/** Creates a single-path "tree" given a bit word.
 * * 010 --> {"0": [{}]} */
export function bitWordToBranch(word: string, withLeaf = true): object {
  // the first bit is for the inner object
  const arrDict: ({} | [])[] = _.map(word, (bit) => (bit === '0' ? {} : []));
  if (withLeaf) (arrDict[0] as any)[0] = 'leaf';
  const branch: object = arrDict.reduce((prev, curr) => {
    if (prev === null) return curr;
    const res: any = curr;
    res[0] = prev;
    return res;
  }, null as any);
  return branch;
}

/** Returns all possible values of a n-bit word */
function nBitWords(length: number) {
  return _.range(0, 2 ** length).map((value) => {
    const msbWord = value.toString(2);
    const word = '0'.repeat(length - msbWord.length) + msbWord;
    return word;
  });
}

export const str = (v: any) => JSON.stringify(v, null, 0);
