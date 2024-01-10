import _ from 'lodash';
import Fragment from '../Fragment.js';
import walkLeaves from '../walkLeaves.js';
import { set, get } from '../accessors.js';
import findDifference from '../findDifference.js';

type Changes<T = unknown> = {
  _original?: Readonly<Fragment<T>>;
  _unsaved?: Fragment<T>;
};

function asOriginal<T extends object>(ob: T & Changes<T>) {
  const clone = _.cloneDeep(ob);
  delete clone._original, clone._unsaved;
  for (const [path, value] of walkLeaves(ob._original ?? {})) {
    set(clone, path, value);
  }
  return clone as T;
}

function saveChanges<T extends object>(ob: T & Changes<T>) {
  if (_.isEmpty(ob._unsaved)) return;
  const original = asOriginal(ob);
  const saved = asOriginal(ob);
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
    set(ob._original!, path, get(original, path));
  }
  return changeLeaves;
}
