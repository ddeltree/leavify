import { get } from '../accessors';
import { CHANGES_SYMBOL, Changeable } from '../changes/Changeable';
import { propose } from '../changes/changes';

/** Boilerplate for a class getter of the stored fragment of original values.
 * @param thisRef a reference to the `this` class instance.
 * @param getterNames the names of the getters within the class, for both `proposed` and `original` fragments, in order to prevent circular reference.
 */
function getOriginals<T extends object, K extends keyof T>(
  thisRef: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...getterNames: K[]
) {
  return (thisRef as Changeable<Omit<T, K>>)[CHANGES_SYMBOL]?.original;
}

/** Boilerplate for a class getter of the stored fragment of proposed values.
 * @param thisRef a reference to the `this` class instance.
 * @param getterNames the names of the getters within the class, for both `proposed` and `original` fragments, in order to prevent circular reference.
 */
function getProposed<T extends object, K extends keyof T>(
  thisRef: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...getterNames: K[]
) {
  return (thisRef as Changeable<Omit<T, K>>)[CHANGES_SYMBOL]?.proposed;
}

class Book {
  readonly id: string;
  constructor(
    public title: string,
    public year: number,
    public chapters: Chapter[],
  ) {
    this.id = '42';
  }

  get original() {
    return getOriginals(this, 'original', 'proposed');
  }
  get proposed() {
    return getProposed(this, 'original', 'proposed');
  }
}

class Chapter {
  readonly id: string;
  constructor(public title: string, public order: number) {
    this.id = '24';
  }
}

const ob = new Book('Book Title', 2020, [new Chapter('Introduction', 1)]);

const value = get(ob, 'title');
console.log(value);

propose(ob, [['title', 'Modified Book Title']]);
console.log(ob.proposed?.title);
