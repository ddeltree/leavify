# Leavify 🍃

**Type-safe leaf paths for nested objects.** Autocompleted paths, the right value
type at the end of each one, and the runtime to go with them.

```ts
import { get, set } from 'leavify';

interface Order {
  id: string;
  customer: { name: string; address: { city: string; zip: string } };
  items: { sku: string; qty: number }[];
}

get(order, 'customer.address.city'); // string  — not `string | number`
get(order, 'items[0].qty'); // number

get(order, 'customer'); // ✗ not a leaf
get(order, 'customer.addres.city'); // ✗ typo caught at compile time
set(order, ['items[0].qty', 'three']); // ✗ wrong value type for this path
```

`LeafPath<Order>` resolves to exactly this — leaves only, bracket notation,
literal or interpolated index:

```
"id" | "customer.name" | "customer.address.city" | "customer.address.zip"
| "items[].sku" | `items[${number}].sku` | "items[].qty" | `items[${number}].qty`
```

## Why

The ecosystem is split in half. `type-fest` and friends give you **types with no
runtime**, and cap recursion at a fixed depth. `dot-prop`, `object-path` and
`lodash.get` give you **runtime with no types**. Leavify is both halves, matched:
the path grammar the types generate is the one the accessors parse.

It also handles what a depth counter can't — genuinely cyclic types terminate
structurally, by tracking the ancestor chain:

```ts
interface A {
  value_A: string;
  B?: B;
}
interface B {
  value_B: string;
  A: A;
}
type P = LeafPath<A>; // 'value_A' | 'B.value_B'
```

## Installation

```
npm install leavify
```

Pure ESM, zero runtime dependencies.

## API

### Accessors

```yaml
get: read the leaf at a path — typed as that leaf, not as a union
set: write the leaf at a path — the value is checked against that path
setUnchecked: escape hatch for paths only known at runtime
has: truthy when the path refers to a leaf that exists
walkLeaves: iterate the path-value entries inside an object
toTree: rebuild the object from a list of path-value entries — the inverse of walkLeaves
diff: compare two objects, yielding [path, before, after] per changed leaf
toPointer / fromPointer: convert between a leaf path and an RFC 6901 JSON Pointer, at the type level too
```

### Iterating and rebuilding

`walkLeaves` yields `[path, value]` as a discriminated union over the path, so
narrowing the path narrows the value — the same shape `diff` returns:

```ts
import { walkLeaves, toTree } from 'leavify';

for (const [path, value] of walkLeaves(order)) {
  console.log(path, value); // 'customer.address.city', 'Lisbon'
  if (path === 'items[0].qty') value.toFixed(); // number here
}

const rebuilt = toTree<Order>([...walkLeaves(order)]); // Order | undefined
```

`toTree` takes the model as an explicit type argument: `LeafPath<T>` is a
conditional type and TypeScript cannot run it backwards, so there is nothing to
infer `T` from. Given it, the entries are checked against the path space and
against the leaf at each path. Without it, the call still accepts entries built
at runtime, as before. The result is `undefined` for an empty list — with no
first path there is no way to tell an array root from an object one.

### Diffing

`diff` yields a discriminated union over the path, so narrowing the path narrows
both values:

```ts
import { diff } from 'leavify';

for (const [path, before, after] of diff(saved, edited)) {
  console.log(`${path}: ${before} → ${after}`);
}
```

Only leaves reachable in the second argument are visited, so removals are not
reported. The second argument may also be a sparse fragment:

```ts
[...diff(order, { customer: { name: 'someone else' } })];
// [['customer.name', 'someone', 'someone else']]
```

### JSON Patch interop

Leavify does not implement RFC 6902 — it hands the wire format to the libraries
that already do, and sells the types on the way in. The conversion runs at the
type level as well, so a literal path yields a literal pointer and the paths stay
typed all the way to the wire:

```ts
import { toPointer, fromPointer } from 'leavify';

toPointer('items[0].sku'); // '/items/0/sku'  — the type, not just the value
fromPointer('/items/0/sku'); // 'items[0].sku'
```

A path that is not fully literal converts as far as the grammar allows:
`` `items[${number}].sku` `` yields `` `/items/${number}/sku` ``, since a numeric
hole cannot contain a delimiter. A `` `${string}` `` hole can, so those widen to
`string`.

```ts
import { diff, toPointer } from 'leavify';
import { applyPatch } from 'fast-json-patch';

const patch = [...diff(saved, edited)].map(([path, , after]) => ({
  op: 'replace' as const,
  path: toPointer(path),
  value: after,
}));

applyPatch(saved, patch);
```

### Hiding fields from the path space

A field marked `Hidden` keeps working normally but never appears in `LeafPath`,
so it is excluded from autocompletion and rejected by `get`, `set` and `has` at
compile time. Use it for derived getters, internal bookkeeping, or fields that
should not be addressable by path.

```ts
import type { Hidden, LeafPath, OmitLeaves, PickLeaves } from 'leavify';

interface User {
  name: string;
  passwordHash: Hidden<string>;
}
type P = LeafPath<User>; // 'name'
```

This narrows the path space — it does not redact the value. The marker is
types-only and emits no runtime code, so `walkLeaves` (and `diff`/`toTree`
through it) still enumerate the field. Keep data that must not leave the object
out of it, rather than relying on `Hidden` to strip it.

`PickLeaves` and `OmitLeaves` narrow the path space per use site, for when a
field must stay addressable elsewhere:

```ts
type Editable = PickLeaves<Order, `customer.${string}`>;
type Public = OmitLeaves<Order, 'customer.taxId'>;
```

## Path grammar

Dot and bracket notation mix freely: `chapters[0].title`, `values[]`, `[1][2]`.
`[]` is shorthand for `[0]`, and exists so that arrays of unknown length stay
autocompletable: TypeScript offers no completion for the `` `[${number}]` ``
half of the path union ([TS#57545](https://github.com/microsoft/TypeScript/issues/57545)),
so `values[]` is the literal an editor can actually suggest. A literal `.`, `[`,
`]` or `\` in a key is escaped with a backslash.

For index signatures, `LeafPath<T, true>` emits hint suffixes — `$` for
`Record<string, _>` and `#` for `Record<number, _>` — which the accessors strip
before resolving.

## License

MIT
