import _ from 'lodash';
import { Fragment, LeafPath } from '@typings';
import { get, has } from '@accessors';

export class Changes<T extends object> {
  private readonly target: Changeable<T>;
  readonly storeEntries: StoreEntries<T>;

  constructor(target: T) {
    this.target = target as Changeable<T>;
    const { store: foundStore, parent } = searchForStore(target);
    let store = foundStore;
    if (store) {
      this.storeEntries = store[STORE_SYMBOL];
    } else {
      const newStore = Object.create(Object.getPrototypeOf(target));
      newStore[STORE_SYMBOL] = this.storeEntries = this.getEmptyStore();
      store = newStore;
    }
    if (parent === undefined || parent === Object.prototype) {
      Object.setPrototypeOf(target, store);
    } else {
      Object.setPrototypeOf(parent, store);
    }
  }
  private getEmptyStore() {
    return {
      owner: this.target,
      original: {} as OriginalEntries<T>,
      proposed: {} as ProposedEntries<T>,
    };
  }
  get proposed() {
    return this.storeEntries.proposed;
  }
  set proposed(value: Fragment<T>) {
    this.storeEntries.proposed = value as ProposedEntries<T>;
  }
  get original() {
    return this.storeEntries.original;
  }
  set original(value: Fragment<T>) {
    this.storeEntries.original = value as OriginalEntries<T>;
  }
  getOriginalValue(path: LeafPath<T>) {
    return has(this.original, path) ?
        get(this.original, path)
      : get(this.target, path);
  }
  setEmptyProposed() {
    this.storeEntries.proposed = this.getEmptyStore().proposed;
  }
  setEmptyOriginal() {
    this.storeEntries.original = this.getEmptyStore().original;
  }
  isEmptyProposed() {
    return _.isEmpty(this.storeEntries.proposed);
  }
  isEmptyOriginal() {
    return _.isEmpty(this.storeEntries.original);
  }
  removeStore() {
    const proto = Object.getPrototypeOf(this.target);
    delete proto[STORE_SYMBOL];
  }
}

export function searchForStore<T extends object>(target: T) {
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
  [STORE_SYMBOL]: StoreEntries<T>;
};
type StoreEntries<T extends object> = {
  owner: OwnerEntry<T>;
  original: OriginalEntries<T>;
  proposed: ProposedEntries<T>;
};
export const STORE_SYMBOL = Symbol('leavify change tracking');
export type OwnerEntry<T extends object> = T;
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
