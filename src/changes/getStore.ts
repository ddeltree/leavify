import {
  STORE_SYMBOL,
  searchForStore,
  Store,
  Changeable,
  ProposedEntries,
  OriginalEntries,
  Changes,
} from './Changeable.js';

// TODO implement for simple objects by passing nothing to _getterNames

/** Boilerplate for a class getter of the stored fragment of original values.
 * @param thisRef a reference to the `this` class instance.
 * @param _getterNames the names of the getters within the class,
 * for both `proposed` and `original` fragments, in order to prevent circular reference.
 */
export function getOriginals<T extends object, K extends keyof T>(
  thisRef: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._getterNames: K[]
) {
  return getStoreEntry<Omit<T, K>>(thisRef, 'original');
}

/** Boilerplate for a class getter of the stored fragment of proposed values.
 * @param thisRef a reference to the `this` class instance.
 * @param getterNames the names of the getters within the class,
 * for both `proposed` and `original` fragments, in order to prevent circular reference.
 */
export function getProposed<T extends object, K extends keyof T>(
  thisRef: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._getterNames: K[]
) {
  return getStoreEntry<Omit<T, K>>(thisRef, 'proposed');
}

function getStoreEntry<T extends object>(
  target: T,
  entry: StoreEntryName<T>,
): ProposedEntries<T> | OriginalEntries<T> {
  // CAUTION: make sure NOT to return undefined, or IntelliSense will hang forever :)
  new Changes(target); // makes sure the store exists
  const store = searchForStore(target as Changeable<T>).store!;
  return store[STORE_SYMBOL][entry];
}

type StoreEntryName<T extends object> = Exclude<
  keyof Store<T>[typeof STORE_SYMBOL],
  'owner'
>;
