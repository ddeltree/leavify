/* eslint-disable */
import { pickLeaves } from '@accessors';
import type { Fragment, LeafPathOrPattern } from '@typings';
import { expectAssignable, expectNotAssignable } from 'tsd';

interface Order {
  id: string;
  customer: { name: string; taxId: string };
  items: { sku: string; qty: number }[];
}

// ---------- LeafPathOrPattern accepts both halves of its union ----------
// The `LeafPath<T>` half is what an editor completes at this position; the
// `string & {}` half is what keeps a pattern or a runtime-built rule
// assignable. Both are load-bearing: a bare `string` constraint would swallow
// the union and the editor would offer nothing, which is exactly how
// PickLeaves/OmitLeaves once shipped with zero completions.
expectAssignable<LeafPathOrPattern<Order>>('customer.name');
expectAssignable<LeafPathOrPattern<Order>>('items[].sku');
expectAssignable<LeafPathOrPattern<Order>>('customer' as `customer.${string}`);
expectAssignable<LeafPathOrPattern<Order>>('anything' as string);

// A non-string stays out — the union is wide, not open.
expectNotAssignable<LeafPathOrPattern<Order>>(42);

// ---------- narrowing the result needs a variable ----------
// `Fragment<T>` is `T | RecursivePartial<T>`, and `Array.isArray` narrows
// through `any[]`. Applied directly to the call, that forces `RecursivePartial`
// to resolve while `T` is still being inferred, and TypeScript gives up:
//
//   Array.isArray(pickLeaves(rows, '[1].a'))  // excessively deep
//
// Binding first costs nothing and fixes it. Not pinned as an `expectError`:
// tsd cannot assert ts2589 ("an error that tsd does not currently support"), so
// the guard is the prose here plus trap 4 in CLAUDE.md. What IS pinned is that
// the bound form works, which is the shape the docs and tests must use.
declare const rows: { a: number }[];

const masked = pickLeaves(rows, '[1].a');
expectAssignable<boolean>(Array.isArray(masked));

// The return is a sparse view, so it is assignable to `Fragment<T>` — which is
// what lets `diff(before, pickLeaves(after, …))` compose without a cast.
expectAssignable<Fragment<Order>>(pickLeaves({} as Order, 'customer.name'));
