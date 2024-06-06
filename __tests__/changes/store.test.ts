import { test, expect, beforeEach } from 'vitest';
import originalBook from '../integration/book.json' assert { type: 'json' };
import { getOriginals, getProposed } from '@changes/getStore';
import { propose, save } from '@changes/changes';
import { get, toTree } from 'src';

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
