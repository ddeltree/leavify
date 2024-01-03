import Fragment from './Fragment.js';
import { Leaf } from './Leaves.js';

/** @param T a single leaf object, that generates a single path-leaf pair */
type Branch<T> = Fragment<T, Leaf>;

export default Branch;
