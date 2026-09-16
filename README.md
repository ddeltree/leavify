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
set(order, 'items[0].qty')('three'); // ✗ wrong value type for this path
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
set: write the leaf at a path — `set(obj, path)(value)`, the value checked against that path
setUnchecked: escape hatch for paths only known at runtime
has: truthy when the path refers to a leaf that exists
walkLeaves: iterate the path-value entries inside an object
toTree: rebuild the object from a list of path-value entries — the inverse of walkLeaves
diff: compare two objects, yielding [path, before, after] per changed leaf
pickLeaves / omitLeaves: project an object down to a set of paths
mask: a reusable projection — pick, omit, compose, apply
toPointer / fromPointer: convert between a leaf path and an RFC 6901 JSON Pointer, at the type level too
```

### Writing

`set` takes the value in a second call — `set(obj, path)(value)`:

```ts
set(order, 'customer.address.city')('Lisbon');
set(order, 'items[0].qty')('three'); // ✗ number expected here
```

That is not a style choice. With the path and the value in one argument list,
TypeScript has to type the value against `LeafValue<T, P>` while `P` is still the
whole of `LeafPath<T>`, which is quadratic — completing a path here took 5.2s on
an 800-leaf model as a `[path, value]` tuple, against 0.8s curried, the same cost
as checking no value at all. Fixing `P` in the first call is what makes the
second one cheap. `setUnchecked` keeps the `[path, value]` entry, since it has no
value type to defer and it replays entries that already exist.

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

### Masking: the same narrowing, at runtime

`pickLeaves` and `omitLeaves` are the runtime twins of those two types. They
project an object down to a set of paths and hand back a sparse `Fragment<T>`:

```ts
import { mask, omitLeaves, pickLeaves } from 'leavify';

pickLeaves(order, 'customer.name'); // { customer: { name: 'someone' } }
omitLeaves(order, 'customer.taxId'); // everything except that leaf
```

A rule names either one leaf or a whole branch, and `mask()` compiles a set of
them once for reuse — `omit` always wins over `pick`, which is the shape a
role-scoped view actually has:

```ts
const support = mask<Order>().pick('customer').omit('customer.taxId');

support.apply(order); // { customer: { name: 'someone', … } }
support.allows('customer.taxId'); // false
```

Masks are immutable, so a base can be specialised per role without the
specialisation leaking back. `allows` also filters a diff into an audit log:

```ts
for (const [path, before, after] of diff(saved, edited))
  if (support.allows(path)) console.log(`${path}: ${before} → ${after}`);
```

Three things worth knowing before you point one at a log:

- **`[]` means _any_ index in a rule**, unlike everywhere else in the grammar,
  where it resolves to `[0]`. `rows[]` is the only spelling an editor can offer
  for the family `` `rows[${number}]` ``, and resolving it to element 0 in a mask
  would redact one row and leak the rest. Name a concrete index — `rows[0]` — if
  that is what you mean.
- **Indices are preserved, so a skipped element leaves a hole.** Picking
  `rows[1].sku` yields an array of length 2 whose first element is empty;
  compacting it would renumber the rows and every path in the output would then
  address a different leaf. `JSON.stringify` renders the hole as `null`.
- **The output is a plain object.** It is rebuilt from entries, so a class
  instance loses its prototype.

**A mask is not redaction for `Hidden` fields.** It cannot see the marker — that
is types-only. An allow-list of exact paths does drop them, but only because they
are never offered as completions: naming one outright still works, and picking a
whole *subtree* sweeps them back in. As above, keep data that must not leave the
object out of it.

## Path grammar

Dot and bracket notation mix freely: `chapters[0].title`, `values[]`, `[1][2]`.
`[]` is shorthand for `[0]`, and exists so that arrays of unknown length stay
autocompletable: TypeScript offers no completion for the `` `[${number}]` ``
half of the path union ([TS#57545](https://github.com/microsoft/TypeScript/issues/57545)),
so `values[]` is the literal an editor can actually suggest. A literal `.`, `[`,
`]` or `\` in a key is escaped with a backslash.

For index signatures, `LeafPath<T, true>` emits hint suffixes — `$` for
`Record<string, _>` and `#` for `Record<number, _>`. Note that the accessors do
_not_ strip them: `interpretPathHints` only resolves `[]`, and a suffix never
reaches an accessor because they all take `LeafPath<T>` with hints off. A mask
rule may carry one, and `pickLeaves`/`omitLeaves`/`mask` strip it themselves.

## License

MIT
