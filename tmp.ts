import { Changeable, CHANGES_SYMBOL } from './src/changes/Changeable';

const b = [1];
const c: Changeable<typeof b> = {
  ...b,
  length: b.length,
  [CHANGES_SYMBOL]: {
    original: { ...[] },
    proposed: { ...[] },
  },
};
