import { get } from '../accessors.js';
import { propose } from '../changes/changes.js';
import { Book, Chapter } from './Book.js';
import { test, expect } from 'vitest';

test(() => {
  expect(1).toBe(1);
});

const ob: Book = new Book('Book Title', 2020, [new Chapter('Introduction', 1)]);

const value = get(ob, 'title');
console.log(value);

propose(ob, [['title', 'Modified Book Title']]);
console.log(ob.proposed?.title);
