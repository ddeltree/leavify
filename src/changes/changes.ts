import _ from 'lodash';
import { walkLeaves, set, get } from '@accessors';
import { Primitive, LeafPath } from '@typings';
import { Changes } from './Changeable.js';

/** Returns the initial object as it was before any proposed or saved changes */
export function cloneDeepAsOriginal<T extends object>(target: T) {
  const changes = new Changes(target);
  if (changes.isEmptyOriginal()) return target;
  const original = _.cloneDeep(target);
  propose(original, [...walkLeaves(changes.original)]);
  save(original);
  return original;
}

/** Sets the proposed leaf changes in-place */
export function save<T extends object>(target: T) {
  const changes = new Changes(target);
  if (changes.isEmptyProposed()) return;
  const changedLeaves = getChangedEntries(target);
  changes.setEmptyProposed();
  const originals = { ...changes.original };
  changes.setEmptyOriginal();
  // do not add entries that propose back to original values
  for (const [path, originalValue] of walkLeaves(originals)) {
    if (Object.hasOwn(changedLeaves, path))
      set(changes.original, [path, originalValue]);
  }
  // Set values in-place
  for (const [path, changeValue] of walkLeaves(changedLeaves)) {
    set(changes.original, [path, changes.getOriginalValue(path)]);
    set(target, [path, changeValue]);
  }
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

/** List all entries of this object whose current value differs from the original value (i.e. the applied entries - proposed and saved)
 * @returns a list of pairs, each containing a path and its original value */
export function getSavedEntries<T extends object>(target: T) {
  const nodes: [LeafPath<T>, Primitive][] = [];
  const changes = new Changes(target);
  if (changes.isEmptyOriginal()) return nodes;
  for (const [path] of walkLeaves(changes.original))
    nodes.push([path, get(target, path)]);
  return nodes;
}

/** Proposes reverting back to the original values associated with each path.
 * To apply the original values, you must call `save()` after `undo()`.
 */
export function undo<T extends object>(
  target: T,
  paths: readonly LeafPath<T>[],
) {
  const changes = new Changes(target);
  if (_.isEmpty(paths)) return;
  // collect original values assuming the paths refer to existing original values
  const originals = changes.original;
  const proposal = paths.map((p) => [p, get(originals, p)] as const);
  for (const path of paths) {
    proposal.push([path, get(originals, path)]);
  }
  propose(target, proposal);
}

/** Propose a list of path-value entries as changes to the target object.
 *
 * Apply the changes by calling `save()`, or delete them with `discard()` */
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

/** Truthy when the current list of proposed changes is empty */
export function isSaved<T extends object>(target: T) {
  const changes = new Changes(target);
  return changes.isEmptyProposed();
}
