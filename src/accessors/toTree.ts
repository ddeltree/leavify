import { setUnchecked } from './accessors.js';
import { Primitive } from '@typings';
import type { LeafEntry } from './walkLeaves.js';

/** What an entry looks like when no model is given: any path, any leaf value. */
type UntypedEntry = readonly [path: string, value: Primitive];

/** What an unannotated `toTree` rebuilds into. */
type UntypedTree = Record<string, Primitive>;

/** `never` is the "no model given" signal. It has to be checked in a naked-type
 * position (`[T] extends [never]`) so the conditional does not distribute, and
 * it keeps `LeafEntry` out of the unannotated path entirely — `LeafEntry` of an
 * index-signature model distributes over `` `${string}` `` and trips
 * *"type instantiation is excessively deep"*. */
type EntryOf<T extends object> =
  [T] extends [never] ? UntypedEntry : LeafEntry<T>;

/** Create a new object from a list of path-value entries.
 *
 * The inverse of {@link walkLeaves}. Pass the model as an explicit type
 * argument to get it back typed, and to have the entries checked against its
 * path space:
 *
 * ```ts
 * const rebuilt = toTree<Order>([...walkLeaves(order)]); // Order | undefined
 * ```
 *
 * `T` cannot be inferred from the entries — `LeafPath<T>` is a conditional type
 * and TypeScript cannot run it backwards — so an unannotated call falls back to
 * {@link UntypedTree} and accepts any path, exactly as it did before.
 *
 * Returns `undefined` for an empty list: with no first path to look at, there
 * is no way to tell an array root from an object one, and guessing would break
 * the round trip for whichever it guessed wrong.
 */
export default function toTree<T extends object = never>(
  leaves: readonly EntryOf<T>[],
): ([T] extends [never] ? UntypedTree : T) | undefined {
  if (leaves.length === 0) return undefined;
  const [firstPath] = leaves[0] as UntypedEntry;
  const tree: object = firstPath.startsWith('[') ? [] : {};
  for (const [path, value] of leaves as readonly UntypedEntry[]) {
    setUnchecked(tree, [path, value]);
  }
  return tree as [T] extends [never] ? UntypedTree : T;
}
