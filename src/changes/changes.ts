import _ from 'lodash';
import Fragment from '../Fragment.js';
import walkLeaves from '../walkLeaves.js';
import { set, get, has } from '../accessors.js';
import findDifference from '../findDifference.js';
import { Changeable, CHANGES_SYMBOL } from './Changeable.js';

/** Returns the initial object as it was before any proposed or saved changes */
export function asOriginal<T extends object>(ob: Changeable<T>): T {
  const changes = ob[CHANGES_SYMBOL];
  if (changes === undefined) return ob;
  const original = _.cloneDeep(ob);
  for (const [path, value] of walkLeaves(changes.original)) {
    set(original, path, value);
  }
  delete ob[CHANGES_SYMBOL];
  return original;
}

/** Sets proposed leaf changes in-place
 * @returns the changed leaves
 */
export function save<T extends object>(ob: Changeable<T>) {
  const changes = ob[CHANGES_SYMBOL];
  if (changes === undefined || _.isEmpty(changes.proposed)) return;
  const original = asOriginal(ob);
  const saved = _.cloneDeep(ob);
  const changeLeaves = _.fromPairs([
    ...findDifference(original, saved),
    ...findDifference(original, changes.proposed),
  ]);
  // If change goes back to original value
  for (const [path, unsavedValue] of walkLeaves(changes.proposed)) {
    if (unsavedValue === get(original, path)) {
      set(ob, path, unsavedValue);
      delete changeLeaves[path];
    }
  }
  // Set values in-place
  for (const [path, change] of walkLeaves(changeLeaves)) {
    set(ob, path, change);
    set(changes.original, path, get(original, path));
  }
  return _.toPairs(changeLeaves);
}

/** Proposes reverting back to original value */
export function undo<T extends object>(
  ob: Changeable<T>,
  fragment: Fragment<T>,
) {
  const changes = ob[CHANGES_SYMBOL];
  if (changes === undefined) return;
  const [path] = walkLeaves(fragment).next().value ?? [''];
  const originals = changes.original;
  if (originals === undefined || !has(originals, path))
    throw new Error(`Branch of path ${path} does not have a change to undo`);
  const proposal = _.cloneDeep(fragment);
  for (const [path] of walkLeaves(fragment)) {
    const og = get(originals, path);
    set(proposal, path, og);
  }
  propose(ob, proposal);
}

/** Propose a leaf value change, which can then be applied to the object by using `save()` or deleted by `discard()` */
export function propose<T extends object>(
  ob: Changeable<T>,
  change: Fragment<T>,
) {
  ob[CHANGES_SYMBOL] ??= {
    original: {} as any,
    proposed: {} as any,
  };
  for (const [path, value] of walkLeaves(change)) {
    set(ob[CHANGES_SYMBOL].proposed, path, value);
  }
}

/** Deletes proposed changes */
export function discard<T extends object>(ob: Changeable<T>) {
  ob[CHANGES_SYMBOL] ??= {
    original: {} as any,
    proposed: {} as any,
  };
  ob[CHANGES_SYMBOL].proposed = {} as any;
}

/** Checks whether there are any proposed changes */
export function isSaved<T extends object>(ob: Changeable<T>) {
  return _.isEmpty(ob[CHANGES_SYMBOL]?.proposed);
}
