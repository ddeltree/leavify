/** Types-only brand. Declared, never constructed, so it emits no runtime code. */
declare const HIDDEN: unique symbol;

/** The brand carried by a hidden field. Rarely needed directly — use {@link Hidden}. */
export type HiddenMarker = { [HIDDEN]: never };

/** Hides a field from the path space.
 *
 * A field whose type is wrapped in `Hidden` keeps working at runtime and in
 * regular property access, but never shows up in `LeafPath`, so it is excluded
 * from autocompletion and rejected by the accessors.
 *
 * Useful for derived getters, internal bookkeeping, and fields that must not be
 * addressable by path (sensitive data, server-owned columns).
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
