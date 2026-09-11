/* eslint-disable */
import { expectType, expectAssignable } from 'tsd';
import { fromPointer, toPointer, walkLeaves } from '@accessors';
import type { FromPointer, LeafPath, ToPointer } from '@typings';

// ---------- the types on their own ----------
expectType<'/flat'>(null as unknown as ToPointer<'flat'>);
expectType<'/a/b/c'>(null as unknown as ToPointer<'a.b.c'>);
expectType<'/items/0/sku'>(null as unknown as ToPointer<'items[0].sku'>);
expectType<'/matrix/1/2'>(null as unknown as ToPointer<'matrix[1][2]'>);
expectType<'/0/id'>(null as unknown as ToPointer<'[0].id'>);

expectType<'flat'>(null as unknown as FromPointer<'/flat'>);
expectType<'a.b.c'>(null as unknown as FromPointer<'/a/b/c'>);
expectType<'items[0].sku'>(null as unknown as FromPointer<'/items/0/sku'>);
expectType<''>(null as unknown as FromPointer<''>);

// the two escaping layers reserve different characters
expectType<'/a~1b'>(null as unknown as ToPointer<'a/b'>);
expectType<'/a~0b'>(null as unknown as ToPointer<'a~b'>);
expectType<'a/b'>(null as unknown as FromPointer<'/a~1b'>);
expectType<'a\\.b'>(null as unknown as FromPointer<'/a.b'>);

// ---------- through the functions ----------
expectType<'/items/0/sku'>(toPointer('items[0].sku'));
expectType<'items[0].sku'>(fromPointer('/items/0/sku'));
// the round trip is an identity at the type level, not just at runtime
expectType<'items[0].sku'>(fromPointer(toPointer('items[0].sku')));

// ---------- a path that is not fully literal ----------
// A numeric hole cannot contain a delimiter, so it survives the conversion.
declare const interpolated: `items[${number}].sku`;
expectType<`/items/${number}/sku`>(toPointer(interpolated));
expectType<`a[${number}]`>(null as unknown as FromPointer<`/a/${number}`>);

// A string hole can contain anything, delimiters included, so it widens.
declare const dynamic: string;
declare const anyKey: `a.${string}`;
expectType<string>(toPointer(dynamic));
expectType<string>(toPointer(anyKey));
expectType<string>(fromPointer(dynamic));

// An array index is digits only, exactly as `/^\\d+$/` reads it at runtime.
expectType<'a[5]'>(null as unknown as FromPointer<'/a/5'>);
expectType<'a.5x'>(null as unknown as FromPointer<'/a/5x'>);
expectType<'a.-1'>(null as unknown as FromPointer<'/a/-1'>);

// ---------- a real model, end to end ----------
interface Order {
  id: string;
  items: { sku: string }[];
}
declare const order: Order;
expectAssignable<LeafPath<Order>>('items[0].sku');
for (const [path] of walkLeaves(order)) {
  // every leaf path of the model converts, and converts back
  expectAssignable<string>(toPointer(path));
  expectAssignable<string>(fromPointer(toPointer(path)));
}
expectType<'/items/0/sku' | '/id'>(
  toPointer('items[0].sku' as 'items[0].sku' | 'id'),
);
