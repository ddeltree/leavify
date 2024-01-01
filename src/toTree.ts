import _ from 'lodash';
import { set } from './accessors.js';
import { Leaves } from './Leaves.js';

/** from path-value pairs to object */

export function toTree(leaves: Leaves): object | undefined {
  if (_.isEmpty(leaves)) return undefined;
  const firstPath = _.first(_.keys(leaves))!;
  const tree: any = firstPath.startsWith('[') ? [] : {};
  _.forEach(leaves, (value, path) => set(tree, path, value));
  return tree;
}
