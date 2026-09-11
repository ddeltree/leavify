/* eslint-disable */
import {
  expectType,
  expectError,
  expectAssignable,
  expectNotAssignable,
} from 'tsd';
import { get, set, setUnchecked, toTree, walkLeaves } from '@accessors';
import type { LeafEntry } from '@accessors/walkLeaves.js';
import type {
  Hidden,
  LeafPath,
  LeafValue,
  Primitive,
  OmitLeaves,
  PickLeaves,
} from '@typings';

interface Order {
  id: string;
  customer: { name: string; address: { city: string; zip: string } };
  items: { sku: string; qty: number }[];
  paid: boolean;
}
declare const order: Order;

// ---------- LeafValue<T, P> ----------
expectType<string>(null as unknown as LeafValue<Order, 'id'>);
expectType<string>(null as unknown as LeafValue<Order, 'customer.name'>);
expectType<string>(null as unknown as LeafValue<Order, 'customer.address.zip'>);
expectType<number>(null as unknown as LeafValue<Order, 'items[0].qty'>);
expectType<string>(null as unknown as LeafValue<Order, 'items[0].sku'>);
expectType<boolean>(null as unknown as LeafValue<Order, 'paid'>);

// omitting P still yields the union of every leaf type
expectType<string | number | boolean>(null as unknown as LeafValue<Order>);

// ---------- get() is typed per path ----------
expectType<string>(get(order, 'id'));
expectType<string>(get(order, 'customer.address.city'));
expectType<number>(get(order, 'items[0].qty'));
expectType<boolean>(get(order, 'paid'));

// ---------- set() checks the value against the path ----------
set(order, ['customer.name', 'someone']);
set(order, ['items[0].qty', 3]);
set(order, ['paid', true]);
expectError(set(order, ['customer.name', 42]));
expectError(set(order, ['items[0].qty', 'three']));
expectError(set(order, ['paid', 'yes']));

// setUnchecked is the escape hatch for runtime-built paths
expectAssignable<object>(setUnchecked({} as object, ['a.b[0]', 1]));

// ---------- path-space filtering ----------
// Pinned first, so the assertions below read as "the whole space minus X"
// instead of restating an unverified union.
type OrderPaths =
  | 'id'
  | 'paid'
  | 'customer.name'
  | 'customer.address.city'
  | 'customer.address.zip'
  | `items[${number | ''}].sku`
  | `items[${number | ''}].qty`;
expectType<OrderPaths>(null as unknown as LeafPath<Order>);

// a pattern keeps every path it matches
expectType<'customer.name' | 'customer.address.city' | 'customer.address.zip'>(
  null as unknown as PickLeaves<Order, `customer.${string}`>,
);
// a literal leaf path keeps exactly itself
expectType<'customer.address.city'>(
  null as unknown as PickLeaves<Order, 'customer.address.city'>,
);
// a union of literals keeps exactly those
expectType<'id' | 'paid'>(null as unknown as PickLeaves<Order, 'id' | 'paid'>);
// picking nothing is loud: it yields never
expectType<never>(null as unknown as PickLeaves<Order, 'customer.nmae'>);

// Omit is the complement of Pick over the same space
expectType<Exclude<OrderPaths, 'id'>>(
  null as unknown as OmitLeaves<Order, 'id'>,
);
expectType<
  'id' | 'paid' | `items[${number | ''}].sku` | `items[${number | ''}].qty`
>(null as unknown as OmitLeaves<Order, `customer.${string}`>);
// removing the whole space leaves never
expectType<never>(null as unknown as OmitLeaves<Order, OrderPaths>);
// a path that matches nothing removes nothing — documented, not accidental
expectType<OrderPaths>(null as unknown as OmitLeaves<Order, 'customer.nmae'>);

// the filters still constrain P to a string
expectError(null as unknown as PickLeaves<Order, 42>);
expectError(null as unknown as OmitLeaves<Order, 42>);

// a Hidden field is outside the path space, so it cannot be picked back in
interface Account {
  email: string;
  passwordHash: Hidden<string>;
}
expectType<never>(null as unknown as PickLeaves<Account, 'passwordHash'>);
expectType<'email'>(null as unknown as OmitLeaves<Account, 'passwordHash'>);

// ---------- toTree() is the typed inverse of walkLeaves() ----------
// The model is explicit: `LeafPath<T>` is a conditional type, so TypeScript
// cannot infer T backwards out of the entries.
expectType<Order | undefined>(toTree<Order>([...walkLeaves(order)]));
expectType<Order | undefined>(toTree<Order>([['items[0].qty', 3]]));

// entries are checked against the path space and against the leaf at the path
expectError(toTree<Order>([['customer.nmae', 'x']]));
expectError(toTree<Order>([['items[0].qty', 'three']]));
expectError(toTree<Order>([['paid', 'yes']]));

// an unannotated call still takes runtime-built entries, as it always did
declare const runtimeEntries: (readonly [string, string])[];
expectAssignable<Record<string, Primitive> | undefined>(toTree(runtimeEntries));

// ---------- walkLeaves() correlates the value with the path ----------
declare const entry: LeafEntry<Order>;
// narrowing the path narrows the value, the same way LeafDiff does
if (entry[0] === 'items[0].qty') expectAssignable<number>(entry[1]);
if (entry[0] === 'id') expectAssignable<string>(entry[1]);
// and it is not narrowed to the wrong leaf
if (entry[0] === 'id') expectNotAssignable<number>(entry[1]);
