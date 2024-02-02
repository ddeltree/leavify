import Fragment from '../types/Fragment.js';

/** The symbol used to store original and proposed values */
const CHANGES_SYMBOL = Symbol("leavify's change tracking properties");

export type Changeable<T extends object> = T & {
  [CHANGES_SYMBOL]?: {
    original: OriginalEntries<T>;
    proposed: ProposedEntries<T>;
  };
};

const ENTRIES_SYMBOL = Symbol(
  'Symbol to identify the type of original entries',
);
/** Marks stored fragments' types and excludes them from autocompletion.
 *
 * Marks OriginalEntries and ProposedEntries as to avoid path autocompletion
 * of a getter which returns [CHANGES_SYMBOL].original or [CHANGES_SYMBOL].proposed,
 * since that would just duplicate the classes' fields under a new parent subpath */
export type ChangeableEntries = {
  [ENTRIES_SYMBOL]?: undefined;
};

export type OriginalEntries<T extends object> = Readonly<Fragment<T>> &
  ChangeableEntries;
export type ProposedEntries<T extends object> = Fragment<T> & ChangeableEntries;

export { CHANGES_SYMBOL };

// TODO? Changeable's fields could be made customizable by providing a ['originals' | 'proposed', path][] argument.
// I could even allow the changes to be stored on an entirely different object, but I don't see the purpose of that at the moment.
// _leavify {original, proposed} could be used as default. These keys should be made into accessor properties in the target object for easy access.
