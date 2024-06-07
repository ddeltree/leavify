import { getOriginals, getProposed } from '@changes/getStore.js';
import * as func from '@changes/changes.js';
import { LeafPath, Primitive } from '@typings';

class Book {
  readonly id = crypto.randomUUID();
  chapters: ChainableChapter[] = [];
  year?: number;
  author?: ChainableAuthor;
  constructor(public title: string) {}
}

class ChangeableBook extends Book {
  get original() {
    return getOriginals(this, 'original', 'proposed');
  }
  get proposed() {
    return getProposed(this, 'original', 'proposed');
  }
  discard = () => func.discard(this);
  isSaved = () => func.isSaved(this);
  asOriginal = () => func.cloneDeepAsOriginal(this);
  save = () => func.save(this);
  propose = (change: readonly [LeafPath<this>, Primitive][]) =>
    func.propose(this, change);
  undo = (paths: readonly LeafPath<this>[]) => func.undo(this, paths);
}

class Chapter {
  readonly id = crypto.randomUUID();
  author?: ChainableAuthor;
  title?: string;
  constructor(public readonly book: ChainableBook) {
    this.author = book.author;
  }
}

class Author {
  readonly id = crypto.randomUUID();
  books: ChainableBook[] = [];
  constructor(public name: string) {}
}

// Setting up chainable methods

class ChainableBook extends ChangeableBook {
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
