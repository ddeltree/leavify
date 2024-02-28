import { get } from '../../accessors.js';
import { Author, Book, Chapter } from './Book.js';
import { test, expect, describe } from 'vitest';
import data from './book.json' assert { type: 'json' };

describe('accessors', () => {
  test('', () => {
    expect(1).toBe(1);
  });
});

const book = new Book(data.title)
  .setYear(data.year)
  .setAuthor((book) => new Author(data.author).setBooks([book]))
  .setChapters((book) =>
    data.chapters.map((title) => new Chapter(book).setTitle(title)),
  );

const value = get(book, 'chapters[0].book.author.books[0].year');
console.log(value);
book.propose([['title', 'Modified Book Title']]);
console.log(book.proposed.title);
