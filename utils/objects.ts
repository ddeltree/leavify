/** The handful of object helpers the accessors need, so that the package ships
 * with no runtime dependencies.
 */

/** Whether the value can hold properties: objects and functions, but not `null`.
 *
 * Functions count as branches here — they are not leaf values, so `walkLeaves`
 * descends into them instead of yielding them.
 */
export function isObject(value: unknown): value is object {
  return (
    value !== null && (typeof value === 'object' || typeof value === 'function')
  );
}

/** The last element of an array, or `undefined` when it is empty. */
export function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}

/** Read the value at a sequence of keys, stopping at the first nullish node.
 *
 * The keys come from `parsePath`, so the path grammar has already been
 * resolved — this walks the keys and nothing more. An empty key list returns
 * the target itself.
 */
export function getByPath(target: unknown, keys: readonly string[]): unknown {
  let ref: unknown = target;
  for (const key of keys) {
    if (ref === null || ref === undefined) return undefined;
    ref = (ref as Record<string, unknown>)[key];
  }
  return ref;
}
