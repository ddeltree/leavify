import { describe, expect, it } from 'vitest';
import { CURSOR, completionsAt, errorsIn } from './languageService.js';

/** Every snippet compiles against this model. `secret` is `Hidden`, so no
 * position in the API should ever offer it. */
const PRELUDE = `
import type { Hidden, LeafPath, LeafValue, OmitLeaves, PickLeaves } from '@typings';
import { get, set, setUnchecked, has, toPointer, toTree } from '@accessors';

interface Order {
  id: string;
  customer: { name: string; address: { city: string } };
  items: { sku: string }[];
  secret: Hidden<string>;
}
declare const order: Order;
`;

const LEAVES = ['customer.address.city', 'customer.name', 'id', 'items[].sku'];

const snippet = (line: string) => `${PRELUDE}\n${line}\n`;

describe('editor completions for leaf paths', () => {
  describe.each([
    ['LeafValue<T, P>', `type V = LeafValue<Order, '${CURSOR}'>;`],
    ['PickLeaves<T, P>', `type P = PickLeaves<Order, '${CURSOR}'>;`],
    ['OmitLeaves<T, P>', `type O = OmitLeaves<Order, '${CURSOR}'>;`],
    ['get()', `const v = get(order, '${CURSOR}');`],
    ['set()', `set(order, ['${CURSOR}', 'x']);`],
    ['has()', `const h = has(order, '${CURSOR}');`],
    ['toTree<T>()', `const t = toTree<Order>([['${CURSOR}', 'x']]);`],
  ])('%s', (_label, line) => {
    it('offers every leaf path of the model', () => {
      expect(completionsAt(snippet(line))).toEqual(LEAVES);
    });

    it('never offers a Hidden field', () => {
      expect(completionsAt(snippet(line))).not.toContain('secret');
    });

    it('never offers a branch, only leaves', () => {
      const offered = completionsAt(snippet(line));
      expect(offered).not.toContain('customer');
      expect(offered).not.toContain('customer.address');
      expect(offered).not.toContain('items');
    });
  });

  it('offers the hint suffixes under LeafPath<T, true>', () => {
    const offered = completionsAt(`
      import type { LeafPath } from '@typings';
      interface Model { tags: Record<string, string>; slots: Record<number, string> }
      declare function check<T extends object, P extends LeafPath<T, true> = LeafPath<T, true>>(path: P): P;
      check<Model>('${CURSOR}');
    `);
    expect(offered).toContain('tags$');
    expect(offered).toContain('slots#');
  });

  it('offers nothing at setUnchecked, which is the untyped escape hatch', () => {
    // Not a gap: `setUnchecked` exists precisely to accept runtime-built paths.
    // Asserted so that giving it a typed signature is a deliberate decision and
    // not an accident.
    expect(
      completionsAt(snippet(`setUnchecked(order, ['${CURSOR}', 1]);`)),
    ).toEqual([]);
  });

  it('offers nothing at toPointer, which converts without a model', () => {
    // `toPointer` infers its path from the argument and maps it to a pointer at
    // the type level; it never sees the model, so there is no path space to
    // enumerate here. The paths reaching it are already typed — they come from
    // `walkLeaves`, `diff`, or a `LeafPath<T>`-typed constant.
    const offered = completionsAt(snippet(`const p = toPointer('${CURSOR}');`));
    // The only suggestion is the empty literal already typed, echoed back.
    expect(offered.filter((name) => LEAVES.includes(name))).toEqual([]);
  });
});

describe('path-space filters accept literal paths and patterns alike', () => {
  it.each([
    ['a literal leaf path', `type X = OmitLeaves<Order, 'customer.name'>;`],
    ['a subtree pattern', 'type X = OmitLeaves<Order, `customer.${string}`>;'],
    ['a literal leaf path', `type X = PickLeaves<Order, 'customer.name'>;`],
    ['a subtree pattern', 'type X = PickLeaves<Order, `customer.${string}`>;'],
  ])('%s: %s', (_label, line) => {
    expect(errorsIn(snippet(line))).toEqual([]);
  });

  it('rejects a path space filtered down to a Hidden field', () => {
    expect(errorsIn(snippet(`type X = PickLeaves<Order, 'secret'>;`))).toEqual(
      [],
    );
    // `secret` is not in the path space, so picking it yields an empty one.
    expect(
      errorsIn(
        snippet(`
          type X = PickLeaves<Order, 'secret'>;
          const path: X = 'secret';
        `),
      ),
    ).not.toEqual([]);
  });
});
