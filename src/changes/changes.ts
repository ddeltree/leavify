import _ from 'lodash';
import { walkLeaves, set, get } from '@accessors';
import { Primitive, LeafPath } from '@typings';
import { Changes } from './Changeable.js';

/** Returns the initial object as it was before any proposed or saved changes */
export function asOriginal<T extends object>(target: T) {
  const changes = new Changes(target);
  if (!changes.isTouched() || changes.isEmptyOriginal()) return target;
  const original = _.cloneDeep(target);
  for (const [path, value] of walkLeaves(changes.original)) {
    set(original, [path, value]);
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
  const changedLeaves = getChangedEntries(target);
  changes.setEmptyProposed();
  const originals = { ...changes.original };
  changes.setEmptyOriginal();
  // do not add entries that are proposed back to original values
  for (const [path, originalValue] of walkLeaves(originals)) {
    if (Object.hasOwn(changedLeaves, path))
      set(changes.original, [path, originalValue]);
  }
  // Set values in-place
  for (const [path, changeValue] of walkLeaves(changedLeaves)) {
    set(changes.original, [path, changes.getOriginalValue(path)]);
    set(target, [path, changeValue]);
  }
  return _.toPairs(changedLeaves);
}

/** Union of saved and proposed */
function getChangedEntries<T extends object>(target: T) {
  const changes = new Changes(target);
  const changedEntries = _.fromPairs(getSavedEntries(target)) as Partial<
    Record<LeafPath<T>, Primitive>
  >;
  // If the proposed change goes back to original value, ignore it
  for (const [path, proposedValue] of walkLeaves(changes.proposed)) {
    if (proposedValue === changes.getOriginalValue(path)) {
      set(target, [path, proposedValue]);
      delete changedEntries[path];
    } else {
      changedEntries[path] = proposedValue;
    }
  }
  return changedEntries;
}

export function getSavedEntries<T extends object>(target: T) {
  const nodes: [LeafPath<T>, Primitive][] = [];
  const changes = new Changes(target);
  if (!changes.isTouched() || changes.isEmptyOriginal()) return nodes;
  for (const [path] of walkLeaves(changes.original))
    nodes.push([path, get(target, path)]);
  return nodes;
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
  proposal: readonly (readonly [LeafPath<T>, Primitive])[],
) {
  const changes = new Changes(target);
  for (const entry of proposal) {
    set(changes.proposed, entry);
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
