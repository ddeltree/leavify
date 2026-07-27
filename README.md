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
toTree: build a new object from a list of path-value entries
diff: compare two objects, yielding [path, before, after] per changed leaf
toPointer / fromPointer: convert between a leaf path and an RFC 6901 JSON Pointer
```

### Iterating and rebuilding

```ts
import { walkLeaves, toTree } from 'leavify';

for (const [path, value] of walkLeaves(order)) {
  console.log(path, value); // 'customer.address.city', 'Lisbon'
}

const rebuilt = toTree([...walkLeaves(order)]);
```

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
that already do, and sells the types on the way in:

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
so it is excluded from autocompletion and rejected by the accessors. Use it for
derived getters, internal bookkeeping, or data that must not be addressable.

```ts
import type { Hidden, LeafPath, OmitLeaves, PickLeaves } from 'leavify';

interface User {
  name: string;
  passwordHash: Hidden<string>;
}
type P = LeafPath<User>; // 'name'
```

`PickLeaves` and `OmitLeaves` narrow the path space per use site, for when a
field must stay addressable elsewhere:

```ts
type Editable = PickLeaves<Order, `customer.${string}`>;
type Public = OmitLeaves<Order, 'customer.taxId'>;
```

## Path grammar

Dot and bracket notation mix freely: `chapters[0].title`, `values[]`, `[1][2]`.
`[]` is shorthand for `[0]`. A literal `.`, `[`, `]` or `\` in a key is escaped
with a backslash.

For index signatures, `LeafPath<T, true>` emits hint suffixes — `$` for
`Record<string, _>` and `#` for `Record<number, _>` — which the accessors strip
before resolving.

## License

MIT
