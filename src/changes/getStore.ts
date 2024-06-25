import {
  STORE_SYMBOL,
  searchForStore,
  Store,
  Changeable,
  ProposedEntries,
  OriginalEntries,
  Changes,
} from './Changeable.js';

/** Get the stored object of original values.
 * @param thisRef a reference to the `this` class or object instance.
 * @param _classGetterNames use this when implementing getter methods inside a class to prevent circular reference, by passing both proposed and original names as arguments.
 * @example
 * import changes from 'leavify/changes';
 *
 * class Book {
 *    title = 'default title'
 *    get original() {
 *      return changes.getOriginals(this, 'original', 'proposed')
 *    }
 *    get proposed() {
 *      return changes.getProposed(this, 'original', 'proposed')
 *    }
 * }
 *
 * const book = new Book()
 * changes.propose(book, [['title', 'new title']])
 * changes.save(book)
 * console.log(book.original.title) // 'default title'
 */
export function getOriginals<T extends object, K extends keyof T>(
  thisRef: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._classGetterNames: K[]
) {
  return getStoreEntry<Omit<T, K>>(thisRef, 'original');
}

/** Get the stored object of proposed values.
 * @param thisRef a reference to the `this` class or object instance.
 * @param _classGetterNames use this when implementing getter methods inside a class to prevent circular reference, by passing both proposed and original names as arguments.
 * @example
 * import changes from 'leavify/changes';
 *
 * class Book {
 *    title = 'default title'
 *    get original() {
 *      return changes.getOriginals(this, 'original', 'proposed')
 *    }
 *    get proposed() {
 *      return changes.getProposed(this, 'original', 'proposed')
 *    }
 * }
 *
 * const book = new Book()
 * changes.propose(book, [['title', 'new title']])
 * console.log(book.proposed.title) // 'new title'
 */
export function getProposed<T extends object, K extends keyof T>(
  thisRef: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._classGetterNames: K[]
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
