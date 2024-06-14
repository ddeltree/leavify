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

## Usage

```ts
import leaves from 'leavify';

const oldState = {
  status: 'ok',
  id_codes: [1, 2, 3],
};

// Check if path refers to a leaf value
if (leaves.has(oldState, 'id_codes')) throw new Error();
if (!leaves.has(oldState, 'id_codes[0]')) throw new Error();

const newState = JSON.parse(JSON.stringify(oldState));
const changePath = 'id_codes[1]';

// Set and get leaf
leaves.set(newState, changePath, 0);
if (leaves.has(newState, changePath)) {
  const newCode = leaves.get(newState, changePath);
  console.log(newCode); // 0
}

// Find difference of objects by leaf path
const differentLeaves = leaves.findDifference(oldState, newState);
console.log(differentLeaves); // { 'id_codes[1]': 0 }

// Reconstruct tree from it's leaves
const tree = leaves.toTree(differentLeaves);
console.log(tree); // { id_codes: [ <1 empty item>, 0 ] }
```
