import _ from 'lodash';
import { Fragment, LeafPath } from '@typings';
import { get, has } from '@accessors';

export class Changes<T extends object> {
  private readonly target: Changeable<T>;
  readonly store: Store<T>[typeof STORE_SYMBOL];

  constructor(target: T) {
    this.target = target as Changeable<T>;
    let proto;
    // TODO: iterate the prototype chain to find the nearest STORE_SYMBOL
    // and keep a reference of the pertaining object (`target`) inside it.
    // NOTE: A prototype chain with cycles would throw a TypeError
    if (this.existsChanges(target)) {
      proto = Object.getPrototypeOf(target);
      this.store = proto[STORE_SYMBOL];
    } else {
      // destructuring would not copy property accessors
      proto = Object.create(Object.getPrototypeOf(target));
      this.store = this.getEmptyStore();
    }
    proto[STORE_SYMBOL] = this.store;
    Object.setPrototypeOf(target, proto);
  }
  private existsChanges(target: T): target is Changeable<T> {
    return Object.hasOwn(Object.getPrototypeOf(target), STORE_SYMBOL);
  }
  private getEmptyStore() {
    return {
      owner: this.target,
      original: {} as OriginalEntries<T>,
      proposed: {} as ProposedEntries<T>,
    };
  }
  get proposed() {
    return this.store.proposed;
  }
  set proposed(value: Fragment<T>) {
    this.store.proposed = value as ProposedEntries<T>;
  }
  get original() {
    return this.store.original;
  }
  set original(value: Fragment<T>) {
    this.store.original = value as OriginalEntries<T>;
  }
  getOriginalValue(path: LeafPath<T>) {
    return has(this.original, path) ?
        get(this.original, path)
      : get(this.target, path);
  }
  setEmptyProposed() {
    this.store.proposed = this.getEmptyStore().proposed;
  }
  setEmptyOriginal() {
    this.store.original = this.getEmptyStore().original;
  }
  isEmptyProposed() {
    return _.isEmpty(this.store.proposed);
  }
  isEmptyOriginal() {
    return _.isEmpty(this.store.original);
  }
  isTouched() {
    return this.existsChanges(this.target);
  }
  removeStore() {
    const proto = Object.getPrototypeOf(this.target);
    delete proto[STORE_SYMBOL];
  }
}

export function searchStore(target: object) {
  let store: object | null = Object.getPrototypeOf(target);
  let parent: object | undefined = undefined;
  while (store && !isStoreOf(store, target)) {
    parent = store;
    store = Object.getPrototypeOf(store);
  }
  return { store, parent } as const;
}

function isStoreOf<T extends object>(
  proto: object,
  target: T,
): proto is Store<T> {
  return isStore(proto) && proto[STORE_SYMBOL].owner === target;
}

function isStore<T extends object>(proto: object): proto is Store<T> {
  return Object.hasOwn(proto, STORE_SYMBOL);
}

export type Changeable<T extends object> = T & Store<T>;
export type Store<T extends object> = {
  [STORE_SYMBOL]: {
    owner: T;
    original: OriginalEntries<T>;
    proposed: ProposedEntries<T>;
  };
};
export const STORE_SYMBOL = Symbol('leavify change tracking');
export type OriginalEntries<T extends object> = ChangeableEntry & Fragment<T>;
export type ProposedEntries<T extends object> = ChangeableEntry & Fragment<T>;

/** Marks stored fragments' types and excludes them from autocompletion.
 *
 * Marks OriginalEntries and ProposedEntries as to avoid path autocompletion
 * of a getter which returns [STORE_SYMBOL].original or [STORE_SYMBOL].proposed,
 * since that would just duplicate the classes' fields under a new parent subpath
 *
 * This symbol only exists as a type, it is not actually in the object itself
 * */
export type ChangeableEntry = { [ENTRIES_SYMBOL]: never };
const ENTRIES_SYMBOL = Symbol('Symbol to identify the type of changed entries');
