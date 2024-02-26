import { getOriginals, getProposed } from '../../changes/getStore.js';

class Book {
  readonly id = crypto.randomUUID();
  chapters: Chapter[] = [];
  year?: number;
  author?: Author;
  constructor(public title: string) {}

  get original() {
    return getOriginals(this, 'original', 'proposed');
  }
  get proposed() {
    return getProposed(this, 'original', 'proposed');
  }
}

class Chapter {
  readonly id = crypto.randomUUID();
  author?: Author;
  title?: string;
  constructor(public readonly book: Book) {
    this.author = book.author;
  }
}

class Author {
  readonly id = crypto.randomUUID();
  books: Book[] = [];
  constructor(public name: string) {}
}

// Setting up chainable methods

class ChainableBook extends Book {
  setAuthor = setChainableField(this, 'author');
  setTitle = setChainableField(this, 'title');
  setYear = setChainableField(this, 'year');
  setChapters = setChainableField(this, 'chapters');
}
class ChainableChapter extends Chapter {
  setTitle = setChainableField(this, 'title');
}
class ChainableAuthor extends Author {
  setBooks = setChainableField(this, 'books');
}

export {
  ChainableAuthor as Author,
  ChainableBook as Book,
  ChainableChapter as Chapter,
};

function setChainableField<const T, K extends keyof T = keyof T>(
  _ref: T, // allows for inference of typeof value
  name: K,
) {
  type Callback = (ref: T) => T[K];
  return function (this: T, value: T[K] | Callback) {
    this[name] =
      typeof value === 'function' ? (value as Callback)(this) : value;
    return this;
  };
}
