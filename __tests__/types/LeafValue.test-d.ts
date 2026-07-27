/* eslint-disable */
import { expectType, expectError, expectAssignable } from 'tsd';
import { get, set, setUnchecked } from '@accessors';
import type { LeafValue } from '@typings';

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
