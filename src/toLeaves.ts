import _ from 'lodash';
import { Leaves, Leaf } from './Leaves.js';
import walkLeaves from './walkLeaves.js';

/** Create a path-value pair record of all the leaf values within an object */
export default function toLeaves<T extends Leaf>(obj: object): Leaves<T> {
  const leaves = [...walkLeaves(obj)].map(([a, b]) => [a, b]);
  const toReturn = _.fromPairs(leaves);
  return toReturn;
}
