import { describe, expect, test } from 'vitest';
import mask, { omitLeaves, pickLeaves } from '@accessors/mask.js';

const order = () => ({
  id: 'o-1',
  customer: { name: 'someone', taxId: '123' },
  items: [{ sku: 'a', qty: 1 }],
});

describe('pickLeaves', () => {
  test('keeps the named leaf and nothing else', () => {
    expect(pickLeaves(order(), 'customer.name')).toEqual({
      customer: { name: 'someone' },
    });
  });

  test('an array root stays an array', () => {
    const rows = [{ a: 1 }, { a: 2 }];
    // Bound to a variable first, deliberately. `Array.isArray()` applied
    // directly to the call resolves `Fragment<T>` while `T` is still being
    // inferred, and trips "type instantiation is excessively deep" — pinned in
    // `__tests__/types/Mask.test-d.ts`. Note vitest would not have noticed;
    // `npm run typecheck` is what catches it.
    const masked = pickLeaves(rows, '[1].a');
    expect(Array.isArray(masked)).toBe(true);
  });
});

describe('omitLeaves', () => {
  test('drops the named leaf and keeps the rest', () => {
    expect(omitLeaves(order(), 'customer.taxId')).toEqual({
      id: 'o-1',
      customer: { name: 'someone' },
      items: [{ sku: 'a', qty: 1 }],
    });
  });

  test('omitting nothing keeps everything', () => {
    expect(omitLeaves(order())).toEqual(order());
  });
});

describe('subtree prefixes', () => {
  test('a prefix keeps every leaf under it', () => {
    expect(pickLeaves(order(), 'customer')).toEqual({
      customer: { name: 'someone', taxId: '123' },
    });
  });

  test('a prefix stops at a segment boundary', () => {
    const o = { customer: { name: 'a' }, customerId: 'x' };
    expect(pickLeaves(o, 'customer')).toEqual({ customer: { name: 'a' } });
  });
});

// `[]` means "any index" when matching, but index 0 when addressing — the one
// place a mask rule diverges from `split()`. In `get`/`set` a path denotes one
// leaf, so `[]` has to resolve to a concrete element. In a mask a rule denotes
// a *set*, and `rows[]` is the only spelling an editor can offer for the family
// `rows[${number}]` (TS#57545). Resolving it to element 0 here would redact one
// row and leak the rest.
describe('the [] wildcard in a mask rule', () => {
  const rows = () => ({ rows: [{ sku: 'a' }, { sku: 'b' }, { sku: 'c' }] });

  test('rows[] matches every index, not just the first', () => {
    expect(pickLeaves(rows(), 'rows[]')).toEqual(rows());
  });

  test('rows[1] matches only that index', () => {
    const masked = pickLeaves(rows(), 'rows[1]') as ReturnType<typeof rows>;
    expect(masked.rows[1]).toEqual({ sku: 'b' });
    expect(masked.rows[0]).toBeUndefined();
    expect(masked.rows[2]).toBeUndefined();
  });
});

// `LeafPath<T, true>` emits `$` for a `Record<string, _>` index signature and
// `#` for `Record<number, _>`. Contrary to what the docs said, the accessors do
// NOT strip those suffixes — `interpretPathHints` only resolves `[]` — so a
// mask rule has to strip them itself.
describe('index-signature hint suffixes', () => {
  const model = () => ({
    tags: { a: '1', b: '2' },
    slots: { 0: 'x' },
    tagsX: { a: 'no' },
  });

  test('a rule spelled with $ masks the record it names', () => {
    expect(pickLeaves(model(), 'tags$')).toEqual({ tags: { a: '1', b: '2' } });
  });

  test('a rule spelled with # masks the record it names', () => {
    expect(pickLeaves(model(), 'slots#')).toEqual({ slots: { 0: 'x' } });
  });
});

describe('mask()', () => {
  type Order = ReturnType<typeof order>;

  test('a mask with no rules is the identity', () => {
    expect(mask<Order>().apply(order())).toEqual(order());
  });

  test('pick and omit compose, and omit wins', () => {
    const m = mask<Order>().pick('customer').omit('customer.taxId');
    expect(m.allows('customer.name')).toBe(true);
    expect(m.allows('customer.taxId')).toBe(false);
    expect(m.allows('id')).toBe(false);
    expect(m.apply(order())).toEqual({ customer: { name: 'someone' } });
  });

  test('a mask is immutable, so a base can be specialised per role', () => {
    const base = mask<Order>().pick('customer');
    const restricted = base.omit('customer.taxId');
    expect(base.allows('customer.taxId')).toBe(true);
    expect(restricted.allows('customer.taxId')).toBe(false);
  });
});

// Consequences of rebuilding from `walkLeaves` entries rather than new
// behaviour, pinned because each one is silent when it goes wrong.
describe('the shape of a masked object', () => {
  test('picking nothing is an empty view, not undefined', () => {
    // The runtime reading of `Extract<LeafPath<T>, never>`, which is `never`.
    // `toTree` returns `undefined` for an empty list; a projection cannot,
    // or every redaction call site would need a null check.
    expect(pickLeaves(order())).toEqual({});
  });

  test('an index is preserved, so a skipped element leaves a hole', () => {
    const o = { rows: [{ sku: 'a' }, { sku: 'b' }] };
    const masked = pickLeaves(o, 'rows[1].sku') as typeof o;
    // Compacting would renumber `rows[1]` to `rows[0]`, and every path in the
    // output would then address a different leaf.
    expect(masked.rows).toHaveLength(2);
    expect(masked.rows[0]).toBeUndefined();
    expect(masked.rows[1]).toEqual({ sku: 'b' });
    // Worth knowing before it shows up in a log: JSON renders the hole as null.
    expect(JSON.stringify(masked)).toBe('{"rows":[null,{"sku":"b"}]}');
  });

  test('the prototype does not survive, because entries carry no class', () => {
    class Point {
      constructor(readonly x: number) {}
    }
    expect(pickLeaves(new Point(1), 'x')).not.toBeInstanceOf(Point);
    expect(pickLeaves(new Point(1), 'x')).toEqual({ x: 1 });
  });

  test('an empty branch vanishes, since walkLeaves yields no entry for it', () => {
    expect(omitLeaves({ a: {}, b: 1 })).toEqual({ b: 1 });
  });

  test('a cycle terminates, inheriting the guard in walkLeaves', () => {
    interface A {
      value_A: 'a';
      B?: B;
    }
    interface B {
      value_b: 'b';
      A: A;
    }
    const a: A = { value_A: 'a' };
    a.B = { A: a, value_b: 'b' };
    expect(pickLeaves(a, 'B')).toEqual({ B: { value_b: 'b' } });
  });

  test('a key containing a dot is ambiguous, because walkLeaves does not escape it', () => {
    // Pre-existing and out of scope: `walkLeaves` emits `Object.entries` keys
    // verbatim, so a leaf keyed "a.b" is indistinguishable from the path a→b.
    // Pinned rather than fixed, so the gap is known instead of surprising.
    const o = { 'a.b': 1 };
    expect(pickLeaves(o, 'a')).toEqual({ a: { b: 1 } });
  });
});
