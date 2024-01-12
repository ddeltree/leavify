import _ from 'lodash';
import Fragment from '../Fragment.js';
import walkLeaves from '../walkLeaves.js';
import { set, get, has } from '../accessors.js';
import findDifference from '../findDifference.js';
import Branch from '../Branch.js';
import fromBranch from '../fromBranch.js';

// TODO? Changeable's fields could be made customizable by providing a ['originals' | 'proposed', path][] argument.
// I could even allow the changes to be stored on an entirely different object, but I don't see the purpose of that at the moment.
// _leavify {original, proposed} could be used as default. These keys should be made into accessor properties in the target object for easy access.

/** Expected object interface for functions under the leavify.changes namespace */
export type Changeable<T = unknown> = T & {
  _original?: Readonly<Fragment<T>>;
  _unsaved?: Fragment<T>;
};

/** Returns the initial object as it was before any proposed or saved changes */
export function asOriginal<T extends object>(ob: Changeable<T>) {
  const clone = _.cloneDeep(ob);
  delete clone._original, delete clone._unsaved;
  for (const [path, value] of walkLeaves(ob._original ?? {})) {
    set(clone, path, value);
  }
  return clone as T;
}

/** Sets proposed leaf changes in-place
 * @returns the changed leaves
 */
export function save<T extends object>(ob: Changeable<T>) {
  if (_.isEmpty(ob._unsaved)) return;
  const original = asOriginal(ob);
  const saved = _.cloneDeep(ob);
  delete saved._original, delete saved._unsaved;
  const changeLeaves = _.fromPairs([
    ...findDifference(original, saved),
    ...findDifference(original, ob._unsaved),
  ]);
  // If change goes back to original value
  for (const [path, unsavedValue] of walkLeaves(ob._unsaved)) {
    // TODO customizable comparison?
    if (unsavedValue === get(original, path)) {
      set(ob, path, unsavedValue);
      delete changeLeaves[path];
    }
  }
  // Set values in-place
  ob._original = {} as Fragment<T>;
  ob._unsaved = {} as Fragment<T>;
  for (const [path, change] of walkLeaves(changeLeaves)) {
    set(ob, path, change);
    set(ob._original, path, get(original, path));
  }
  return _.toPairs(changeLeaves);
}

/** Proposes reverting back to original value */
export function undo<T extends object>(ob: Changeable<T>, branch: Branch<T>) {
  // TODO undo fragment instead of branch
  const [path] = fromBranch(branch);
  if (ob._original === undefined || !has(ob._original, path))
    throw new Error(`Branch of path ${path} does not have a change to undo`);
  const value = get(ob._original, path);
  const changes = _.cloneDeep(branch);
  set(changes, path, value);
  propose(ob, changes);
}

/** Propose a leaf value change, which can then be applied to the object by using `save()` or deleted by `discard()` */
export function propose<T extends object>(
  ob: Changeable<T>,
  change: Fragment<T>,
) {
  ob._unsaved ??= {} as Fragment<T>;
  for (const [path, value] of walkLeaves(change)) {
    set(ob._unsaved, path, value);
  }
}

/** Deletes proposed changes */
export function discard<T extends object>(ob: Changeable<T>) {
  ob._unsaved = {} as Fragment<T>;
}

/** Checks whether there are any proposed changes */
export function isSaved<T extends object>(ob: Changeable<T>) {
  return _.isEmpty(ob._unsaved);
}
