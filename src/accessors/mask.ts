import type { Fragment, LeafPathOrPattern, Primitive } from '@typings';
import { compileMatcher } from '@utils/pathPattern.js';
import { setUnchecked } from './accessors.js';
import walkLeaves from './walkLeaves.js';

/** Keep only the leaves at the given paths, as a new sparse object.
 *
 * The runtime twin of {@link PickLeaves}, which does the same to the path space
 * at the type level.
 */
export function pickLeaves<T extends object>(
  obj: T,
  ...paths: LeafPathOrPattern<T>[]
): Fragment<T> {
  const allows = compileMatcher(paths);
  return project(obj, allows);
}

/** Drop the leaves at the given paths, keeping every other one.
 *
 * The runtime twin of {@link OmitLeaves}. Note the mirror of `Exclude<_, never>`
 * at the edges: omitting nothing keeps everything, just as picking nothing keeps
 * nothing.
 */
export function omitLeaves<T extends object>(
  obj: T,
  ...paths: LeafPathOrPattern<T>[]
): Fragment<T> {
  const denies = compileMatcher(paths);
  return project(obj, (path) => !denies(path));
}

/** Rebuild `obj` from the leaves their path satisfies `keep`.
 *
 * The result is always a plain object or array, never a class instance — it is
 * assembled from entries, so the prototype does not survive.
 */
function project<T extends object>(
  obj: T,
  keep: (path: string) => boolean,
): Fragment<T> {
  // Seeded from the source, not from the first path. `toTree` has to guess the
  // root's shape from `firstPath.startsWith('[')` and therefore returns
  // `undefined` for an empty list; here the source object is in hand, so the
  // root is known even when nothing is kept.
  const tree: object = Array.isArray(obj) ? [] : {};
  for (const [path, value] of walkLeaves(obj))
    if (keep(path)) setUnchecked(tree, [path, value as Primitive]);
  return tree as Fragment<T>;
}

/** A reusable projection: a set of rules, compiled once, applied many times.
 *
 * `pick` switches the mask into allow-list mode; a mask with no rules is the
 * identity. `omit` always wins over `pick`, so a role-scoped view reads as what
 * it is — a subtree, minus the fields that role may not see:
 *
 * ```ts
 * const support = mask<Order>().pick('customer').omit('customer.taxId');
 * support.apply(order);
 * ```
 *
 * Every call returns a new frozen mask, so a base mask can be shared and
 * specialised without the specialisations leaking back into it.
 *
 * A mask narrows what leaves a value, not what the path space contains — it
 * cannot see a {@link Hidden} field, because that marker emits no runtime code.
 * A `pick` list drops hidden fields only because they are never offered as
 * completions; a `pick` of a whole *subtree* sweeps them right back in, and an
 * `omit` list leaves them in place. Keep data that must not leave the object
 * out of it.
 */
export interface Mask<T extends object> {
  pick(...paths: LeafPathOrPattern<T>[]): Mask<T>;
  omit(...paths: LeafPathOrPattern<T>[]): Mask<T>;
  /** Project an object through the mask. */
  apply(obj: T): Fragment<T>;
  /** Whether the mask lets the leaf at this path through. */
  allows(path: string): boolean;
  /** The rules as given — not the leaves they resolve to, which need a model. */
  readonly rules: {
    readonly picked: readonly string[];
    readonly omitted: readonly string[];
  };
}

export default function mask<T extends object>(): Mask<T> {
  return build([], []);
}

function build<T extends object>(
  picked: readonly string[],
  omitted: readonly string[],
): Mask<T> {
  const isPicked = compileMatcher(picked);
  const isOmitted = compileMatcher(omitted);
  const allows = (path: string) =>
    (picked.length === 0 || isPicked(path)) && !isOmitted(path);

  return Object.freeze({
    pick: (...paths: LeafPathOrPattern<T>[]) =>
      build<T>([...picked, ...paths], omitted),
    omit: (...paths: LeafPathOrPattern<T>[]) =>
      build<T>(picked, [...omitted, ...paths]),
    apply: (obj: T) => project(obj, allows),
    allows,
    rules: Object.freeze({
      picked: Object.freeze([...picked]),
      omitted: Object.freeze([...omitted]),
    }),
  });
}
