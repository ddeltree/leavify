import _ from 'lodash';
import Fragment from './Fragment.js';
import toLeaves from './toLeaves.js';

export default class Branch<T extends object> {
  /** @param branch a single-leaf object, which generates a single path-value pair */
  constructor(branch: Fragment<T, unknown>) {
    if (!this.isBranch(branch))
      throw new Error(
        `Expected a branch of single leaf, received this instead: ${JSON.stringify(
          branch,
        )}`,
      );
    Object.assign(this, branch);
  }

  asPathValue() {
    return _.entries(toLeaves(this))[0];
  }

  private isBranch(tree: object) {
    // TODO a more efficient way to check
    const leaves = toLeaves<string | undefined>(tree);
    return _.keys(leaves).length === 1;
  }
}
