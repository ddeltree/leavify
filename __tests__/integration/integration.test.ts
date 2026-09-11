/* eslint-disable */
import data from './book.json' assert { type: 'json' };
import { test, expect, beforeEach, describe } from 'vitest';
import {
  LeafPath,
  diff,
  fromPointer,
  get,
  has,
  set,
  toPointer,
  toTree,
  walkLeaves,
} from 'leavify';
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

test('get() is typed per path through the published package', () => {
  const title: string = get(book, p('title'));
  const year: number | undefined = get(book, p('year'));
  expect(title).toBe(data.title);
  expect(year).toBe(data.year);
});

/** Rebuilds the book from its leaves. Typed end to end: no cast anywhere. */
function snapshot(): Book {
  const tree = toTree<Book>([...walkLeaves(book)]);
  if (tree === undefined) throw new Error('the book has no leaves');
  return tree;
}

test('walkLeaves and toTree round trip', () => {
  const leaves = [...walkLeaves(book)];
  expect(leaves.length).toBeGreaterThan(0);
  const tree = snapshot();
  for (const [path, value] of leaves) {
    expect(get(tree, p(path))).toBe(value);
  }
});

test('toTree gives the model back, not a bare object', () => {
  const rebuilt: Book = snapshot();
  expect(rebuilt.title).toBe(data.title);
});

describe('diff', () => {
  test('reports the leaves that changed, with both values', () => {
    const before = snapshot();
    set(book, [p('title'), 'a different title']);
    const changes = [...diff(before, snapshot())];
    expect(changes).toEqual([['title', data.title, 'a different title']]);
  });

  test('an unchanged object yields nothing', () => {
    const unchanged = snapshot();
    expect([...diff(unchanged, unchanged)]).toEqual([]);
  });
});

describe('JSON Pointer interop', () => {
  test('every leaf path converts to a pointer and back', () => {
    for (const [path] of walkLeaves(book)) {
      expect(fromPointer(toPointer(path))).toBe(path);
    }
  });

  test('produces RFC 6901 pointers', () => {
    expect(toPointer(p('author.name'))).toBe('/author/name');
    expect(toPointer(p('chapters[0].title'))).toBe('/chapters/0/title');
  });

  test('the pointer is a literal type through the published .d.ts', () => {
    // These annotations only compile if the template-literal conversion
    // survived the declaration build — `npm run typecheck` is what checks it.
    const pointer: '/author/name' = toPointer('author.name');
    const path: 'chapters[0].title' = fromPointer('/chapters/0/title');
    expect(pointer).toBe('/author/name');
    expect(path).toBe('chapters[0].title');
  });
});
