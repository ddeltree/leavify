import _ from 'lodash';
import toLeaves from './toLeaves.js';
import { Leaves, Leaf } from './Leaves.js';
import { get } from './accessors.js';
import Fragment from './Fragment.js';

/** Find the differences between an object and it's modified clone (of same type)
 * @param original imagined as an immutable state object,
 * whose properties can be thought of as the "original" ones.
 * @param fragment a modified clone or subset of `original`,
 * imagined as mutable and intended for making changes to.
 */
export default function findDifference<T>(original: T, fragment: Fragment<T>) {
  const differentLeaves: Leaves = {};

  for (const [path, changeValue] of Object.entries(toLeaves(fragment))) {
    const originalValue = get(original, path);
    if (originalValue !== changeValue) {
      differentLeaves[path] = changeValue;
    }
  }

  return differentLeaves;
}
