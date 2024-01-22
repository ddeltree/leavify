import _ from 'lodash';
import { set } from './accessors.js';
import { Leaves } from './types/Leaves.js';

/** from path-value pairs to object */

export default function toTree(leaves: Leaves): object | undefined {
  const entries = [...leaves];
  if (_.isEmpty(entries)) return undefined;
  const [firstPath] = entries[0];
  const tree: object = firstPath.startsWith('[') ? [] : {};
  for (const [path, value] of entries) {
    set(tree, path, value);
  }
  return tree;
}
