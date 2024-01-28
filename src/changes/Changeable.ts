import Fragment from '../types/Fragment.js';

/** The symbol used to store original and proposed values */
const leavify = Symbol("leavify's change tracking properties");

export type Changeable<T extends object> = T & {
  [leavify]?: {
    original: OriginalEntries<T>;
    proposed: ProposedEntries<T>;
  };
};

export type OriginalEntries<T extends object> = Readonly<Fragment<T>>;
export type ProposedEntries<T extends object> = Fragment<T>;

export { leavify as CHANGES_SYMBOL };

// TODO? Changeable's fields could be made customizable by providing a ['originals' | 'proposed', path][] argument.
// I could even allow the changes to be stored on an entirely different object, but I don't see the purpose of that at the moment.
// _leavify {original, proposed} could be used as default. These keys should be made into accessor properties in the target object for easy access.
