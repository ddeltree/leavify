/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import Fragment from '../types/Fragment.js';
import walkLeaves from '../walkLeaves.js';
import { set, get } from '../accessors.js';
import findDifference from '../findDifference.js';
import { Changeable, CHANGES_SYMBOL } from './Changeable.js';
import { Primitive } from '../types/Leaves.js';
import LeafPath from '../types/NewLeafPath.js';

/** Returns the initial object as it was before any proposed or saved changes */
export function asOriginal<T extends object>(target: Changeable<T>): T {
  const changes = target[CHANGES_SYMBOL];
  if (changes === undefined) return target;
  const original = _.cloneDeep(target);
  for (const [path, value] of walkLeaves(changes.original)) {
    set(original as T, path as LeafPath<T>, value);
  }
  delete original[CHANGES_SYMBOL];
  return original;
}

/** Sets proposed leaf changes in-place
 * @returns the changed leaves
 */
export function save<T extends object>(target: Changeable<T>) {
  const changes = target[CHANGES_SYMBOL];
  if (changes === undefined || _.isEmpty(changes.proposed)) return;
  const original = asOriginal(target);
  const saved = _.cloneDeep(target);
  const changeLeaves = _.fromPairs([
    ...findDifference(original, saved),
    ...findDifference(original, changes.proposed),
  ]);
  // If change goes back to original value
  for (const [path, unsavedValue] of walkLeaves(changes.proposed as T)) {
    if (unsavedValue === get(original, path)) {
      set(target, path, unsavedValue);
      delete changeLeaves[path];
    }
  }
  // Set values in-place
  for (const [path, change] of walkLeaves(changeLeaves as T)) {
    set(target, path, change);
    set(changes.original as T, path, get(original, path));
  }
  changes.proposed = {} as Fragment<T>;
  return _.toPairs(changeLeaves);
}

/** Proposes reverting back to original value */
export function undo<T extends object>(
  target: Changeable<T>,
  paths: readonly LeafPath<T>[],
) {
  const changes = target[CHANGES_SYMBOL];
  if (changes === undefined || _.isEmpty(paths)) return;
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
  target: Changeable<T>,
  change: readonly (readonly [LeafPath<T>, Primitive])[],
) {
  target[CHANGES_SYMBOL] ??= {
    original: {} as any,
    proposed: {} as any,
  };
  for (const [path, value] of change) {
    set(target[CHANGES_SYMBOL].proposed, path, value);
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
