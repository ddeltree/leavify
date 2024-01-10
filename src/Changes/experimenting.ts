import _ from 'lodash';
import Fragment from '../Fragment.js';
import walkLeaves from '../walkLeaves.js';
import { set, get } from '../accessors.js';
import findDifference from '../findDifference.js';

export type Changeable<T = unknown> = T & {
  _original?: Readonly<Fragment<T>>;
  _unsaved?: Fragment<T>;
};

export function asOriginal<T extends object>(ob: Changeable<T>) {
  const clone = _.cloneDeep(ob);
  delete clone._original, delete clone._unsaved;
  for (const [path, value] of walkLeaves(ob._original ?? {})) {
    set(clone, path, value);
  }
  return clone as T;
}

export function saveChanges<T extends object>(ob: Changeable<T>) {
  if (_.isEmpty(ob._unsaved)) return;
  const original = asOriginal(ob);
  const saved = _.cloneDeep(ob);
  delete saved._original, delete saved._unsaved;
  const savedLeaves = findDifference(original, saved);
  const unsavedLeaves = findDifference(original, ob._unsaved);
  const changeLeaves = {
    ...savedLeaves,
    ...unsavedLeaves,
  };
  // If change goes back to original value
  for (const [path, unsavedValue] of walkLeaves(ob._unsaved)) {
    // TODO customizable comparison
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
  return changeLeaves;
}
