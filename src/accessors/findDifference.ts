import { get } from './accessors.js';
import { Fragment } from '@typings';
import walkLeaves from './walkLeaves.js';

/** Find the differences between an object and it's modified clone (of same type)
 * @param original imagined as an immutable state object,
 * whose properties can be thought of as the "original" ones.
 * @param fragment a modified clone or subset of `original`,
 * imagined as mutable and intended for making changes to.
 */
export default function* findDifference<T extends object>(
  original: T,
  fragment: T | Fragment<T>,
) {
  for (const [path, changeValue, props] of walkLeaves(fragment)) {
    const originalValue = get(original, path);
    if (originalValue !== changeValue) {
      yield [path, changeValue, props];
    }
  }
}
