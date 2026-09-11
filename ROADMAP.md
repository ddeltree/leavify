# Roadmap

> Written in English to match the rest of the repo (README, JSDoc). Planning notes, not a promise of dates.

## Positioning

Leavify is **a typed addressing layer for nested state** — a bidirectional bridge between "object as a tree" and "object as a set of stable, compile-time-verified addresses".

Once every leaf has a typed address, a family of problems collapses into "do something per address": diff, patch, audit, per-field permissions, i18n keys, form fields, layered config.

**The product, in one sentence:** _how do these two **typed** objects differ, with paths you can autocomplete, filter by permission, render as a readable changelog, and send as a minimal PATCH?_

Nobody answers that today. `immer` answers "what did I mutate inside this producer?" (patches from a mutation recorder). `fast-json-patch`, `generate-json-patch`, `json-diff-ts`, `jsondiffpatch` answer "how do these two blobs differ?" — and all of them return `path: string`, untyped against your model. That gap is the bet.

## Layers

```
L2  verticals   →  form engine · i18n · audit log · PATCH client
L1  derived     →  typed diff · Fragment (sparse patch) · path masking / ACL
L0  addressing  →  LeafPath · LeafValue<T,P> · get/set/has/walkLeaves/toTree
```

- **L0** is the technical edge, but on its own it is a utility — good, not adoptable.
- **L1** is the product differentiation, and it is empty in the market.
- **L2** is where adoption comes from — and only **one** vertical is needed, not five.

## Status

Steps 0–4 and the repositioning landed on 2026-07-27. Step 5 (the demo vertical)
is open, and so is one refinement noted under step 3.

## Steps

### 0. ✅ Extract the path-space exclusion marker, then drop `leavify/changes`

`src/types/LeafPath.ts` and `src/types/RecursivePartial.ts` both import `ChangeableEntry` from `@changes/Changeable.js` — the type core depends on the module being dropped. Both files carry `/* eslint-disable no-restricted-imports */` at the top, so the inversion was already known and silenced.

Extract the phantom-symbol mechanism into `src/types/` as a concept of its own (a general "hide this field from the path space" marker). After that `changes` has zero inbound edges and removal is a `git rm`, not surgery.

Then remove `leavify/changes`: the `changes` re-exports in `src/index.ts`, the `./changes` subpath in the `exports` map, the `changes` input in `vite.config.ts`, and `src/changes/` itself. Also drops it out of the main entry's bundle.

**Safe to remove outright:** 36 downloads in the last month against a package last published 2024-06-26 — registry noise, no real dependents. Git history keeps the code. Note the removal in the changelog.

Landed as `src/types/Hidden.ts`, a types-only brand (`declare const` — no runtime
emit, unlike the `Symbol()` call it replaced). `leavify/changes` is gone.

### 1. ✅ `LeafValue<T, P>` — value type per path

Today `LeafValue<T>` takes only `T` and returns the union of _every_ leaf type in the object:

```ts
get(order, 'customer.name'); // string | number   ← should be string
get(order, 'items[0].qty'); // string | number   ← should be number
```

`Refs<T>` already carries the `[key, parent]` tuples, so the information is there — it needs to be indexed _by path_ instead of taking the last of everything. Prerequisite for everything in L1.

Landed as `MatchChain`/`ChainValue` in `LeafPath.ts`, covered by `__tests__/types/LeafValue.test-d.ts`.

Note on `set`: the first attempt kept a loose `[string & {}, Primitive]` overload as an escape hatch, which silently swallowed every wrong-value error — any string matched the loose signature, so the strict one never got to fail. It also blew up as _"type instantiation is excessively deep"_. Both went away by splitting the escape hatch into a separate `setUnchecked` instead of an overload. If a loose overload is ever reintroduced, the tsd cases in `LeafValue.test-d.ts` are what catch the regression.

### 2. ✅ Typed `diff(a, b)`

Landed as `src/accessors/diff.ts`, replacing `findDifference` (the old name yielded only the new value and lost the tuple type). `LeafDiff<T>` is a discriminated union over the path, so narrowing the path narrows both values.

A leaf absent from `before` yields `undefined` rather than throwing, which is where it diverges from the old `findDifference`. Removals are still not reported — only leaves reachable in `after` are visited.

### 3. ✅ JSON Pointer interop

`toPointer()` / `fromPointer()` — two small functions bridging `a.b[0]` ↔ `/a/b/0`.

Strategic point: **hand the wire format to `fast-json-patch` instead of competing with it.** We sell types and ergonomics; they carry the RFC 6902 standard and the ecosystem. Verified end to end: `diff` + `toPointer` produces valid RFC 6902 `replace` ops.

Landed as `src/accessors/pointer.ts`. Note the two escaping layers, which are _not_ the same set: RFC 6901 reserves `~` and `/`; leavify's grammar reserves `.`, `[`, `]` and `\`. A key containing `/` needs no leavify escape, and a key containing `.` needs no pointer escape. `toPointer` unescapes the leavify layer before emitting.

**Refinement landed.** `toPointer`/`fromPointer` were typed `string -> string`; they are now generic over the string, with `src/types/PointerString.ts` mirroring the runtime as template-literal types. The recursive template parsing over the escape rules is written and covered: one shared table in `__tests__/accessors/pointer.test.ts` drives both halves, so they cannot drift. A numeric hole survives the conversion (`` `items[${number}].sku` `` → `` `/items/${number}/sku` ``); a `` `${string}` `` hole widens to `string`, since it could contain a delimiter. That closes the loop on "typed all the way to the wire".

### 4. ✅ Public `Hidden` marker + `PickLeaves`/`OmitLeaves`

The marker extracted in step 0 is now public API, alongside `PickLeaves`/`OmitLeaves` for narrowing the path space per use site.

`Hidden<T>` hides a field everywhere; `OmitLeaves` hides it at one use site. This is the most original idea in the codebase — it was invented to serve one internal case in `changes`, and it outlived that module.

### 5. One demo vertical — OPEN

Pick **one**. Preference: audit log / "what changed" — it is visual, fits a README GIF, and everyone has suffered with it.

This step is not marketing. A general-purpose primitive with no one-sentence "what is it for" gets adopted for nothing.

## ✅ Repositioning

- README leads with the typed-path story, and every example in it is verified — the type claims by `tsd`, the runtime ones against the built bundle.
- `package.json` `description` and `keywords` follow.
- Main bundle went from 7.16 kB (shared chunk) + two entry points to a single 4.22 kB entry.

## Before publishing

Not done, and deliberately left for a human decision:

- **Version.** Still `0.3.0`. Removing `leavify/changes` and renaming `findDifference` → `diff` are breaking, so this wants at least `0.4.0` (semver allows breaking in a minor at `0.x`), with the removal called out in `CHANGELOG.md`.
- `engines` and `sideEffects: false` are still missing from `package.json`.
- No benchmarks yet — worth having before making performance claims against `type-fest`.

## `leavify/changes` — dropped

Removed in step 0. Rationale, recorded so the decision isn't relitigated:

- **No users to break.** 36 downloads/month against a package last published 2024-06-26.
- **It holds every known bug, and the fix is a rewrite.** The four defects below sit on top of prototype injection, which would have to become a `WeakMap` regardless. Not abandoning working code — avoiding a rewrite that doesn't lead to the product.
- **Nothing in steps 1–5 needs it.** `findDifference` lives in `accessors`; the audit-log vertical is diff-based, not session-based.
- **Its one durable asset is extracted, not lost** — the path-space exclusion marker (step 0 → step 4).
- It loses head-on to `immer` on mutation recording, which is a non-goal.

Defects found on 2026-07-27, kept as a record in case the module is ever revived:

1. `cloneDeepAsOriginal` does not return a pristine clone — the value rewinds correctly, but the clone carries phantom history (`getSavedEntries` → `[["title","x"]]`, `getOriginal` → the _pre_-rewind value). Should be `[]` and `{}`.
2. `getSavedEntries` contradicts its own JSDoc: the doc promises the _original_ value, the code pushes `get(target, path)` — the _current_ one.
3. `undo` throws `No leaf value found at the given path` for a path with no history. Reverting something unchanged should be a no-op.
4. Dead code in `undo`: `.map()` already builds the proposal and the `for` below pushes everything again, duplicated.

Measured cost of the design: `save` over 20k objects = ~1370ms (~68µs each) vs. 80ms to install the stores. The `Changes` constructor calls `Object.setPrototypeOf` on _every_ invocation even when the store exists, and nearly every exported function instantiates it (`save` does so 3× in its call tree).

**If an editing session is ever wanted back**, it returns as a thin layer over typed diff + `Fragment<T>`, on a `WeakMap` from day one — not as a revival of this code.

## Non-goals

- Competing with `immer` on mutation recording.
- Competing with `fast-json-patch` on the wire format — interop instead (step 3).
- Shipping five verticals. One, done well.
