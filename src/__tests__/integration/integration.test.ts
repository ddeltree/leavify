import { get } from '../../accessors.js';
import { Author, Book, Chapter } from './Book.js';
import { test, expect } from 'vitest';
import data from './book.json' assert { type: 'json' };

test(() => {
  expect(1).toBe(1);
});

const hdm: Book = new Book(data.title)
  .setYear(data.year)
  .setAuthor((book) => new Author(data.author).setBooks([book]))
  .setChapters((book) =>
    data.chapters.map((title) => new Chapter(book).setTitle(title)),
  );

const value = get(hdm, 'chapters[0].title');
console.log(value);
hdm.propose([['title', 'Modified Book Title']]);
console.log(hdm.proposed.title);
