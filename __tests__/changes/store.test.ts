/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, beforeEach, describe } from 'vitest';
import originalBook from '../integration/book.json' assert { type: 'json' };
import { getOriginals, getProposed } from '@changes/getStore';
import { propose, save } from '@changes/changes';
import { get, toTree } from 'src';
import { STORE_SYMBOL, Store, searchStore } from '@changes/Changeable';

let book: typeof originalBook;
const proposal = [
  ['author', 'me'],
  ['chapters[1]', 'second'],
  ['chapters[]', 'first'],
] as const;

beforeEach(() => {
  book = structuredClone(originalBook);
});

test('getProposed()', () => {
  propose(book, proposal);
  const fragment = getProposed(book, 'year');
  expect(fragment).not.toBeUndefined();
  expect(fragment).toEqual(toTree(proposal));
});

test('getOriginals()', () => {
  propose(book, proposal);
  save(book);
  const saved = proposal.map(([p]) => [p, get(originalBook, p)] as const);
  expect(getOriginals(book, 'year')).toEqual(toTree(saved));
});

describe('Search store prototype', () => {
  test("when it's deep in the prototype chain", () => {
    const target = {};
    const store: Store<typeof target> = {
      [STORE_SYMBOL]: {
        owner: target,
        original: {} as any,
        proposed: {} as any,
      },
    };
    const refs = [target, { a: 0 }, { b: 1 }, store, { c: 2 }];
    for (let i = 0; i < refs.length - 1; i++) {
      const [prev, next] = refs.slice(i, i + 2);
      Object.setPrototypeOf(prev, next);
    }
    expect(searchStore(target).store).not.toBeNull();
  });
});