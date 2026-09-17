import type { ToTemplate } from '@typings';
import { bracketsReg } from '@utils/parsePath.js';

/** Convert a concrete leaf path into its completable template form.
 *
 * `'items[1].qty'` becomes `'items[].qty'` — the spelling an editor can offer,
 * and the spelling a per-leaf registry is keyed by.
 */
export function toTemplate<P extends string>(path: P): ToTemplate<P> {
  return path.replace(bracketsReg, '[]') as ToTemplate<P>;
}
