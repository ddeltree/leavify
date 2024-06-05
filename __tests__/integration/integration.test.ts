/* eslint-disable */
import data from './book.json' assert { type: 'json' };
import { test, expect, beforeEach, describe } from 'vitest';
import { LeafPath, has, set, get, Primitive } from 'leavify';
import { Author, Book, Chapter } from './Book.js';
import { STORE_SYMBOL, Changes } from '@changes/Changeable';

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
  const path = p('author.books[].chapters[].author.id');
  let prevValue;
  const newValue = 2;
  if (has(book, path)) prevValue = get(book, path);
  expect(prevValue).not.toBeUndefined();
  set(book, [path, newValue]);
  expect(has(book, path)).toBe(true);
  expect(get(book, path)).toBe(newValue);
});

test.todo('Different paths, same reference => same leaf', () => {
  // TODO?: it would be nice if `book.proposed.title` === `book.proposed.author.books[].title` for the same book, given the same reference
  book.propose([['author.books[].title', 'new title']]);
  expect(book.proposed.title).not.toBeUndefined();
  expect(book.proposed.title).toBe(book.proposed.author?.books?.[0].title);
});

describe('propose', () => {
  const title = 'new title';
  test('discard', () => {
    book.propose([['author.books[].title', title]]);
    expect(book.proposed.author?.books?.[0].title).toBe(title);
    expect(book.title).not.toBe(title);
    book.discard();
    expect(book.proposed.author?.books?.[0].title).toBe(undefined);
    expect(book.author?.books?.[0].title).not.toBe(title);
  });

  test('isSaved and asOriginal', () => {
    book.propose([['title', title]]);
    expect(book.proposed.title).toBe(title);
    expect(book.title).not.toBe(title);
    expect(book.isSaved()).toBe(false);
    expect(book.asOriginal()).toEqual(book);
  });
});

describe('save', () => {
  test('', () => {
    const proposal: [LeafPath<Book>, Primitive][] = [
      ['title', 'new title'],
      ['year', 0],
      ['author.name', 'someone'],
      ['chapters[].title', 'chapter 42'],
    ];
    book.propose(proposal);
    expect(book.isSaved()).toBe(false);
    book.save();
    const originalBook = book.asOriginal();
    expect(originalBook).not.toEqual(book);
    for (const [path] of proposal) {
      const newValue = get(book, path),
        originalValue = get(originalBook, path);
      expect(newValue).not.toBe(originalValue);
    }
    book.undo(proposal.map((p) => p[0]));
    book.save();
    expect(book).toEqual(originalBook);
  });
});
