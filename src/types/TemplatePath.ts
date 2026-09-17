/** The type-level half of `src/accessors/template.ts`.
 *
 * It mirrors that file step for step, so one table in
 * `__tests__/accessors/template.test.ts` drives both and neither half can drift
 * without a test going red — the arrangement `pointer.ts` / `PointerString.ts`
 * already uses.
 */

/** The completable template form of the leaf path `P`: every index group
 * becomes the `[]` an editor can offer.
 *
 * One rule covers both halves of the problem. A literal index (`items[1].qty`)
 * and the interpolated member of `LeafPath<T>` (`` `items[${number}].qty` ``)
 * are both `` `[${number}]` `` to the compiler, so both collapse — and the
 * interpolated one is precisely the member that makes a registry lookup miss at
 * runtime.
 *
 * @example
 * type A = ToTemplate<'items[1].qty'>;          // 'items[].qty'
 * type B = ToTemplate<`items[${number}].qty`>;  // 'items[].qty'
 * type C = ToTemplate<'a.b'>;                   // 'a.b'
 */
export type ToTemplate<P extends string> =
  P extends `${infer HEAD}[${infer IDX extends number}]${infer REST}` ?
    HEAD extends `${string}\\` ?
      // the bracket belongs to the key, so put it back and keep scanning
      `${HEAD}[${IDX}]${ToTemplate<REST>}`
    : `${HEAD}[]${ToTemplate<REST>}`
  : P;
