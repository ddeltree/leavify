import _ from 'lodash';
import Fragment from './Fragment.js';

/** A single-leaf object, which generates a single path-value pair
 * @param T the "tree" object, the superset for this branch type
 */
type Branch<T extends object> = Fragment<T, unknown>;
export default Branch;
