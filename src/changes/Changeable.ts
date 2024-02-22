import Fragment from '../types/Fragment.js';

/** The symbol used to store original and proposed values */
const CHANGES_SYMBOL = Symbol("leavify's change tracking properties");

export type Changeable<T extends object> = T & {
  [CHANGES_SYMBOL]?: {
    original: OriginalEntries<T>;
    proposed: ProposedEntries<T>;
  };
};

/** Marks stored fragments' types and excludes them from autocompletion.
 *
 * Marks OriginalEntries and ProposedEntries as to avoid path autocompletion
 * of a getter which returns [CHANGES_SYMBOL].original or [CHANGES_SYMBOL].proposed,
 * since that would just duplicate the classes' fields under a new parent subpath */
export type ChangeableEntry = { [ENTRIES_SYMBOL]: 'original' | 'proposed' };
const ENTRIES_SYMBOL = Symbol('Symbol to identify the type of changed entries');

export class ChangeableEntryFactory {
  static createOriginals<T extends object>(target: T) {
    return this.create(target as Readonly<Fragment<T>>, 'original');
  }
  static createProposed<T extends object>(target: T) {
    return this.create(target as Fragment<T>, 'proposed');
  }
  private static create<T extends object>(
    target: T,
    type: 'original' | 'proposed',
  ): T & ChangeableEntry {
    const res = target as T & ChangeableEntry;
    res[ENTRIES_SYMBOL] = type;
    return res;
  }
}

export type OriginalEntries<T extends object> = ReturnType<
  typeof ChangeableEntryFactory.createOriginals<T>
>;
export type ProposedEntries<T extends object> = ReturnType<
  typeof ChangeableEntryFactory.createProposed<T>
>;

export { CHANGES_SYMBOL };
