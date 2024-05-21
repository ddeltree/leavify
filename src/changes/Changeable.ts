import _ from 'lodash';
import { Fragment, LeafPath } from '@typings';
import { get, has } from '@accessors';

/** The symbol used to store original and proposed values */
export const CHANGES_SYMBOL = Symbol('leavify change tracking');

export type Changeable<T extends object> = T & Chest<T>;

export type Chest<T extends object> = {
  [CHANGES_SYMBOL]: {
    original: OriginalEntries<T>;
    proposed: ProposedEntries<T>;
  };
};

export class Changes<T extends object> {
  private readonly target: Changeable<T>;
  readonly chest: Chest<T>[typeof CHANGES_SYMBOL];

  constructor(target: T) {
    this.target = target as Changeable<T>;
    const proto = { ...Object.getPrototypeOf(target) };
    if (this.existsChanges(target)) this.chest = proto[CHANGES_SYMBOL];
    else this.chest = this.getEmptyChest();
    proto[CHANGES_SYMBOL] = this.chest;
    Object.setPrototypeOf(target, proto);
  }
  private getEmptyChest() {
    return {
      original: {} as OriginalEntries<T>,
      proposed: {} as ProposedEntries<T>,
    };
  }
  setEmptyChest() {
    const emptyChest = this.getEmptyChest();
    this.chest.original = emptyChest.original;
    this.chest.proposed = emptyChest.proposed;
  }
  get proposed() {
    return this.chest.proposed;
  }
  set proposed(value: Fragment<T>) {
    this.chest.proposed = value as ProposedEntries<T>;
  }
  get original() {
    return this.chest.original;
  }
  set original(value: Fragment<T>) {
    this.chest.original = value as OriginalEntries<T>;
  }
  getOriginalValue(path: LeafPath<T>) {
    return has(this.original, path) ?
        get(this.original, path)
      : get(this.target, path);
  }
  setEmptyProposed() {
    this.chest.proposed = this.getEmptyChest().proposed;
  }
  setEmptyOriginal() {
    this.chest.original = this.getEmptyChest().original;
  }
  isEmptyProposed() {
    return _.isEmpty(this.chest.proposed);
  }
  isEmptyOriginal() {
    return _.isEmpty(this.chest.original);
  }
  isTouched() {
    return this.existsChanges(this.target);
  }
  removeChest() {
    const proto = Object.getPrototypeOf(this.target);
    delete proto[CHANGES_SYMBOL];
  }
  private existsChanges(target: T): target is Changeable<T> {
    // return Object.hasOwn(target, CHANGES_SYMBOL);
    return Object.hasOwn(Object.getPrototypeOf(target), CHANGES_SYMBOL);
  }
}

export type OriginalEntries<T extends object> = ChangeableEntry & Fragment<T>;
export type ProposedEntries<T extends object> = ChangeableEntry & Fragment<T>;

/** Marks stored fragments' types and excludes them from autocompletion.
 *
 * Marks OriginalEntries and ProposedEntries as to avoid path autocompletion
 * of a getter which returns [CHANGES_SYMBOL].original or [CHANGES_SYMBOL].proposed,
 * since that would just duplicate the classes' fields under a new parent subpath
 *
 * This symbol only exists as a type, it is not actually in the object itself
 * */
export type ChangeableEntry = { [ENTRIES_SYMBOL]: never };
const ENTRIES_SYMBOL = Symbol('Symbol to identify the type of changed entries');
