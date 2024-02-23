import _ from 'lodash';
import walkLeaves from '../walkLeaves.js';
import { set, get } from '../accessors.js';
import findDifference from '../findDifference.js';
import { Changes } from './Changeable.js';
import { Primitive } from '../types/Leaves.js';
import LeafPath from '../types/LeafPath.js';

/** Returns the initial object as it was before any proposed or saved changes */
export function asOriginal<T extends object>(target: T) {
  const changes = new Changes(target);
  if (!changes.isTouched()) return target;
  const original = _.cloneDeep(target);
  for (const [path, value] of walkLeaves(changes.original)) {
    set(original, path, value);
  }
  new Changes(original).removeChest();
  return original;
}

/** Sets proposed leaf changes in-place
 * @returns the changed leaves
 */
export function save<T extends object>(target: T) {
  const changes = new Changes(target);
  if (!changes.isTouched() || changes.isEmptyProposed()) return;
  const original = asOriginal(target);
  const saved = _.cloneDeep(target);
  const changeLeaves = _.fromPairs([
    ...findDifference(original, saved),
    ...findDifference(original, changes.proposed),
  ]);
  // If change goes back to original value
  for (const [path, unsavedValue] of walkLeaves(changes.proposed)) {
    if (unsavedValue === get<T>(original, path)) {
      set(target, path, unsavedValue);
      delete changeLeaves[path];
    }
  }
  // Set values in-place
  for (const [path, change] of walkLeaves(changeLeaves as T)) {
    set(target, path, change);
    set(changes.original, path, get(original, path));
  }
  changes.setEmptyProposed();
  return _.toPairs(changeLeaves);
}

/** Proposes reverting back to original value */
export function undo<T extends object>(
  target: T,
  paths: readonly LeafPath<T>[],
) {
  const changes = new Changes(target);
  if (!changes.isTouched() || _.isEmpty(paths)) return;
  // collect original values assuming the paths refer to existing original values
  const originals = changes.original;
  const proposal = paths.map((p) => [p, get(originals, p)] as const);
  for (const path of paths) {
    proposal.push([path, get(originals, path)]);
  }
  propose(target, proposal);
}

/** Propose a leaf value change, which can then be applied to the object by using `save()` or deleted by `discard()` */
export function propose<T extends object>(
  target: T,
  change: readonly (readonly [LeafPath<T>, Primitive])[],
) {
  const changes = new Changes(target);
  for (const [path, value] of change) {
    set(changes.proposed, path, value);
  }
}

/** Deletes proposed changes */
export function discard<T extends object>(target: T) {
  const changes = new Changes(target);
  changes.setEmptyProposed();
}

/** Checks whether there are any proposed changes */
export function isSaved<T extends object>(target: T) {
  const changes = new Changes(target);
  return changes.isEmptyProposed();
}
