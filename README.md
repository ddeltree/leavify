# Leavify 🍃

A package that provides some helper functions for **implementing leaf value changes and change tracking functionality to javascript objects, including arrays and classes**.

### Functionality includes

- ☘️ Accessors for leaf values, including iteration
- 🌿 IntelliSense for leaf paths
- 🌳 Conversion of tree to/from leaves
- 🍂 Proposing, saving and reverting changes
- 🍁 Listing the changes, both as a list or as an object fragment

## Installation

`npm install leavify`

## Examples

Suppose we have the following interfaces:

```ts
interface Book {
  title: string;
  author: string;
  year: number;
  chapters: Chapter[];
}
interface Chapter {
  title: string;
  number: number;
}

const book: Book = {
  title: 'The Golden Compass',
  author: 'Philip Pullman',
  year: 1995,
  chapters: [{ title: 'The Decanter of Tokay', number: 1 }],
};
```

### propose and save a list of entries

```ts
import changes from 'leavify/changes';

changes.propose(book, [
  ['author', 'Pullman'],
  ['chapters[0].number', 0],
]);
changes.save(book);

changes.getOriginal(book).chapters?.[0].number; // 1
```

### iterate the leaf entries of an object

```ts
import { walkLeaves, toTree } from 'leavify';

for (const [path, value] of walkLeaves(book)) {
  console.log(path, value); // ['title', 'new title']
}

// Leaves to/from tree
const tree = toTree([...walkLeaves(book)]);
```

### set up getter methods for a class

```ts
import changes from 'leavify/changes';

class Book {
  title = 'default title';
  get original() {
    return changes.getOriginal(this, 'original', 'proposed');
  }
  get proposed() {
    return changes.getProposed(this, 'original', 'proposed');
  }
}

const book = new Book();
changes.propose(book, [['title', 'new title']]);
changes.save(book);

book.title; // 'new title'
book.original.title; // 'default title'
```

## API

Here's a brief description of each function defined:

```yaml
get: get the leaf value of a given path
set: set the leaf value of a given path
has: truthy for a path that refers to a leaf value that exists

toTree: create a new object from a list of path-value entries
walkLeaves: iterate the path-value entries inside an object
findDifference: compare two objects and return the entries by which they differ

changes:
  propose: push a list of entries to change
  discard: delete the list of proposed entries
  save: apply the proposed entries in-place
  undo: propose a list of paths back to the original values, without applying
  isSaved: truthy when there are no proposed (unsaved) changes
  getOriginal: make an object from the original entries
  getProposed: make an object from the proposed entries
  getSavedEntries: list the applied entries - proposed and saved
  cloneDeepAsOriginal: clone deep and undo changes
```
