/* eslint-disable */
import data from './book.json' assert { type: 'json' };
import { test, expect, beforeEach } from 'vitest';
import { LeafPath, get, has, set, toTree, walkLeaves } from 'leavify';
import { Author, Book, Chapter } from './Book.js';

let book: Book;
const p = <const T extends LeafPath<Book>>(x: T) => x;

beforeEach(() => {
  book = new Book(data.title)
    .setYear(data.year)
    .setAuthor((book) => new Author(data.author).setBooks([book]))
    .setChapters((book) =>
      data.chapters.map((title) => new Chapter(book).setTitle(title)),
    );
});

test('accessors', () => {
  const path = p('author.name');
  let prevValue;
  const newValue = 'someone else';
  if (has(book, path)) prevValue = get(book, path);
  expect(prevValue).not.toBeUndefined();
  set(book, [path, newValue]);
  expect(has(book, path)).toBe(true);
  expect(get(book, path)).toBe(newValue);
});

test('walkLeaves and toTree round trip', () => {
  const leaves = [...walkLeaves(book)];
  expect(leaves.length).toBeGreaterThan(0);
  const tree = toTree(leaves);
  for (const [path, value] of leaves) {
    expect(get(tree as object, path as never)).toBe(value);
  }
});
