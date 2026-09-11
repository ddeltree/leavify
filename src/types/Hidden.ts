/** Types-only brand. Declared, never constructed, so it emits no runtime code. */
declare const HIDDEN: unique symbol;

/** The brand carried by a hidden field. Rarely needed directly — use {@link Hidden}. */
export type HiddenMarker = { [HIDDEN]: never };

/** Hides a field from the path space.
 *
 * A field whose type is wrapped in `Hidden` keeps working at runtime and in
 * regular property access, but never shows up in `LeafPath`, so it is excluded
 * from autocompletion and rejected by `get`, `set` and `has` at compile time.
 *
 * Useful for derived getters, internal bookkeeping, and fields that should not
 * be addressable by path.
 *
 * **This narrows the path space; it does not redact the value.** The marker is
 * types-only — the symbol below is declared, never constructed — so nothing
 * about it survives to runtime, and the walkers that enumerate an object with
 * `Object.entries` (`walkLeaves`, and `diff`/`toTree` through it) still visit
 * the field. Data that must not leave the object has to be kept out of it, or
 * removed before it reaches those functions. `__tests__/accessors/hidden.test.ts`
 * pins where the boundary falls.
 *
 * @example
 * interface User {
 *   name: string;
 *   passwordHash: Hidden<string>;
 * }
 * type P = LeafPath<User>; // 'name' — `passwordHash` is not addressable
 */
export type Hidden<T> = T & HiddenMarker;

/** The keys of T whose values are marked {@link Hidden}. */
export type HiddenKeys<T> = {
  [K in keyof T]: T[K] extends HiddenMarker ? K : never;
}[keyof T];
