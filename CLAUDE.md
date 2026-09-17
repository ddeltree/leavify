# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`leavify` — a pure-ESM TypeScript library for reading, writing and diffing the **leaf values** of nested JS objects (including arrays and class instances) by string path, where the path space is typed against the model. Single entry point: `leavify`.

## Direction

See `ROADMAP.md`. The package is positioned as **a typed addressing layer for nested state**, not a change-tracking library. Steps 0–4 landed on 2026-07-27; the open item is step 5, one demo vertical (preference: audit log). `leavify/changes` was removed — do not revive it. Explicit non-goals: competing with `immer` on mutation recording, and competing with `fast-json-patch` on the RFC 6902 wire format (interop instead, via `toPointer`).

## Commands

```bash
npm run test                  # unit tests (vitest, excludes __tests__/integration)
npm run test -- --types       # type-level tests via tsd on __tests__/types/*.test-d.ts
npm run test -- --package     # builds, npm-links the package, runs __tests__/integration
npm run typecheck             # tsc --noEmit over sources + runtime tests
npm run check                 # typecheck, then all three of the above, in order
npm run test -- accessors     # single file/pattern: extra args pass through to vitest
npm run coverage              # vitest --coverage (watch mode)
npm run build                 # vite build -> dist/
npm run lint                  # eslint src/** utils/** __tests__/**
```

`npm run typecheck` (`tsconfig.typecheck.json`) is the gate for everything vitest only transpiles. Vitest does not type-check, so a type regression in a runtime test file is invisible to `npm test` — that is how a broken `toTree` call sat green. The config excludes `__tests__/types/*.test-d.ts`, since those are full of deliberate errors that `tsd` owns.

`npm test` dispatches through `test.sh`, which switches on `--types` / `--package` flags. `--types` requires `dist/src/index.d.ts` to exist (it touches an empty one if missing) because tsd resolves the package's declared `types` field. `--package` runs against the _built_ artifact via `npm link`, so it catches packaging/export-map regressions that unit tests can't.

CI (`.github/workflows/test.yml`) runs build → unit → package → types on push/PR to `main`.

## Releasing

`.github/workflows/release.yml` runs **release-please** on every push to `main`. It keeps one
open release PR (`chore(main): release x.y.z`) holding the version bump and the generated
`CHANGELOG.md` entry; merging that PR tags the release. There is no local release command and
no `standard-version` — the bump cannot be forgotten, because it *is* the PR.

Publishing stays manual and stays on your machine:

```bash
git pull                      # after the release PR merges
npm publish                   # prepublishOnly runs `npm run check && npm run build` first
```

Two configuration points worth knowing before touching `release-please-config.json`:

- **`bump-minor-pre-major: true`** preserves the pre-1.0 semantics this package has always had —
  a `BREAKING CHANGE:` bumps the minor (0.4.0 → 0.5.0), not the major. release-please's own
  default is `false`, which would ship the next breaking change as **1.0.0**. Go to 1.0.0 by
  deliberately flipping this, never by accident.
- **`.release-please-manifest.json`** is the source of truth for the current version. It was
  seeded at `0.4.0`, the last release cut by hand; release-please maintains it from there and
  does not need to infer the version from tags.

## Architecture

### Path grammar

Paths are strings mixing dot and bracket notation: `chapters[0].title`, `values[]`, `[1][2]`. `utils/parsePath.ts` is the single parser:

- `split()` splits on unescaped `.` then unescaped `[n]` groups; `[]` normalizes to `[0]`.
- `parsePath()` returns groups of keys — one group per dot-segment, with the root key followed by its indices. `setUnchecked()` relies on this grouping to know whether to create `{}` or `[]` for a missing intermediate node.
- `interpretPathHints()` normalizes a path by round-tripping it through `split()` — so `[]` resolves to `[0]`. It does **not** strip the `$`/`#` hint suffixes that `LeafPath<T, true>` emits for `Record<string, _>` / `Record<number, _>` index signatures, despite what this file and the README used to claim: `keyIndicesReg` keeps them inside the key. Nothing breaks, because every public accessor takes `LeafPath<T>` with `HINT = false`, so a suffix cannot legally reach one. A **mask rule** can carry one, and `utils/pathPattern.ts` strips it itself. Every public accessor calls `interpretPathHints()`, then tokenizes with `parsePath()` before walking the object.
- `utils/pathPattern.ts` is the *matcher*, deliberately separate from the parser: `compileMatcher(rules)` turns a list of mask rules into a predicate over leaf paths. It compares tokens rather than strings, so a prefix rule stops at a segment boundary structurally — `customer` and `customerId` are simply different tokens, and there is no `startsWith` check that can be forgotten.

`[]` is not typist's sugar — it is the only *completable* spelling of an index into a mutable
array. `Arr` in `LeafPath.ts` emits `` `[${number | ''}]` `` for one, and TypeScript offers no
completion for the `` `[${number}]` `` half ([microsoft/TypeScript#57545](https://github.com/microsoft/TypeScript/issues/57545)):
type `user.roles` at a `PickLeaves`/`LeafPath` position and the editor suggests nothing, so the
interpolated paths that genuinely exist in the type stay invisible. The `''` member puts the
literal `user.roles[]` in the union beside them, which the editor *can* offer. It spells `[]`
rather than `[0]` because a non-`as const` array literal has no known length — offering `[0]`
would assert an element nobody promised. Resolving `[]` to index `0` in `split()` is the
compromise that keeps the runtime consistent with a path the type space had to invent. A
readonly tuple needs none of this: its indices are literal, so `Arr` emits `[0]`, `[1]`, …
directly.

**`[]` means something different in a mask rule, and that is deliberate.** In an addressing
context (`get`, `set`, `has`) a path denotes one leaf, so `split()` resolves `[]` to index 0.
In a *matching* context a rule denotes a set, and `rows[]` is the only completable spelling
for the whole family `` `rows[${number}]` `` — so `utils/pathPattern.ts` reads it as **any
index**. Collapsing the two would make a mask redact row 0 and leak every other row, which
is a security bug rather than an inconsistency. The divergence has its own test, named after
itself, in `__tests__/accessors/pathPattern.test.ts` and `__tests__/accessors/mask.test.ts`.

A "leaf" is any non-object value **plus `null`** — see the `switch` in `has()`. Functions and symbols are not leaves.

`IsIndex` in `PointerString.ts` is digits-only on purpose: `` `${number}` `` also admits `-1`, `1.5` and `1e5`, which the runtime `/^\d+$/` reads as ordinary keys. Using the wider one would make the two halves disagree on `/a/-1`.

Two escaping layers exist and they reserve _different_ characters. Leavify's grammar reserves `.`, `[`, `]`, `\`; RFC 6901 reserves `~` and `/`. A key containing `/` needs no leavify escape; a key containing `.` needs no pointer escape. `pointer.ts` translates between them — `toPointer` unescapes the leavify layer before emitting.

### `src/accessors/`

Runtime primitives, all path-based:

- `accessors.ts` — `get` (typed as the leaf at that path), `has`, `set` (curried: `set(obj, path)(value)`, value checked against the path), `setUnchecked` (escape hatch for runtime-built paths; takes a `[path, value]` entry and is *not* curried; `set` delegates to it). The asymmetry is measured, not arbitrary — see trap 3.
- `walkLeaves.ts` — generator over leaf entries, cycle-guarded by the `Branch` value stack. Yields `LeafEntry<T>`, a discriminated union over the path (same shape as `LeafDiff`), so the value narrows with the path.
- `toTree.ts` — entries → new object; root is an array if the first path starts with `[`. Generic over the model, which must be passed explicitly (`toTree<Order>(…)`) because `LeafPath<T>` is not an inferable position. The `T = never` default routes unannotated calls to a plain `[string, Primitive]` entry, deliberately keeping `LeafEntry` off that path: `LeafEntry` of an index-signature model distributes over `` `${string}` `` and trips _"type instantiation is excessively deep"_ (trap 2 below). `diff` binds `walkLeaves` to `T` rather than `T | Fragment<T>` for the same reason.
- `diff.ts` — yields `[path, before, after]` as `LeafDiff<T>`, a discriminated union over the path. Only visits leaves reachable in `after`, so removals are not reported; a leaf absent from `before` yields `undefined`.
- `mask.ts` — `pickLeaves` / `omitLeaves` (runtime twins of `PickLeaves`/`OmitLeaves`) and the `mask()` builder. All three return `Fragment<T>` and never `undefined`: a projection that selects nothing is an empty view, so the root is seeded from `Array.isArray(obj)` rather than from `toTree`'s first-path heuristic. `mask()` carries no accumulated path union — see trap 4.
- `template.ts` — `toTemplate`, which collapses a concrete index into the completable `[]` spelling (`items[1].qty` → `items[].qty`). Same two-halves arrangement as `pointer.ts`: `src/types/TemplatePath.ts` mirrors it, and one shared table in `__tests__/accessors/template.test.ts` drives both plus a negative pass. It exists because a per-leaf registry is keyed by the completable spelling while `diff`/`walkLeaves` yield a concrete index — `labels[path]` type-checks against an *annotated* `Record<LeafPath<T>, X>` (the interpolated member becomes an index signature) and returns `undefined`. Note the split: the runtime `replace` is what fixes the miss; the type mirror is what lets the fixed form keep its literal. The mirror does **not** make the unfixed form fail.
- `pointer.ts` — `toPointer` / `fromPointer` for RFC 6901 interop. Both are generic over the string, and `src/types/PointerString.ts` mirrors the runtime step for step as template-literal types (`ToPointer` / `FromPointer`). The two halves are kept honest by one shared table in `__tests__/accessors/pointer.test.ts` that drives the runtime assertion and the type assertion, plus a negative pass — without it a conversion resolving to `never` would satisfy every type assertion silently.

### `src/types/`

The type-level half of the library, and the hard part.

`LeafPath<T, HINT>` is built from `Refs<T>` — a recursive mapped type producing tuples of `[key, parent]` pairs down to each leaf — then stringified by `ToString`. It guards against infinite recursion by excluding children already seen in the chain (`CHILD extends ROOT | PARENT | CHAIN[number][1]`), which is why genuinely cyclic types terminate structurally instead of at a fixed depth.

`LeafValue<T, P>` indexes the same `Refs<T>` by path: `MatchChain` distributes over the union of chains, keeps the ones whose `ToString` matches `P`, and `ChainValue` reads the type off the last pair. Omitting `P` yields the union of every leaf type.

`Hidden.ts` holds the path-space exclusion marker — a `declare const` unique symbol, so it exists only in the types and emits no runtime code. A field typed `Hidden<T>` is dropped from `Refs` via `HiddenKeys`, so it never appears in any path. `PickLeaves`/`OmitLeaves` do the same narrowing per use site instead of per declaration.

Changes here are easy to get subtly wrong, and they are covered by **two** suites that check different properties:

- `__tests__/types/*.test-d.ts` (tsd, `npm run test -- --types`) — assignability: does this path resolve to this type, is this one rejected.
- `__tests__/types/completions.test.ts` (vitest, part of the normal run) — **what an editor offers at the cursor**, via the real TypeScript language service over a virtual file (`__tests__/types/languageService.ts`).

The second suite exists because the first one structurally cannot catch a missing completion. A type parameter constrained to `string` type-checks every call while offering no suggestion at all, so an assignability suite stays green while autocompletion — the headline feature — is broken. That is exactly how `PickLeaves`/`OmitLeaves` shipped with zero completions. Any new public API that takes a path needs a case in _both_.

**Watch for five traps that already bit once:**

1. A loose overload on `set` (`[string & {}, Primitive]`) silently defeats value checking — every string matches it, so the strict signature never fails. That is why the escape hatch is a separate `setUnchecked` function, not an overload. `__tests__/types/LeafValue.test-d.ts` catches the regression.
2. `LeafValue<T, P>` instantiated with `P` at its full constraint is O(paths × chains) and can trip _"type instantiation is excessively deep"_. Keep it inferred from a concrete argument.
3. **The same instantiation also leaks as editor latency, with nothing failing.** Pairing a path with its value in one argument list makes TypeScript type the value against `LeafValue<T, P>` while `P` is still the full union. Measured on the synthetic 800-leaf model in `__bench__/`: completing a path took 5.2s as `set(o, [p, v])`, 5.2s as `set(o, p, v)`, and **0.8s** as `set(o, p)(v)` — which is the floor of a signature doing no value checking at all. Hence the curried `set`. Never reintroduce a form that takes the path and the value together.
4. **An array in a type parameter's _constraint_ kills completions outright.** Measured across six shapes at a rest parameter: `<P extends readonly LeafPath<T>[]>(...p: P)` and `<const P extends …[]>(...p: P)` both offer `[""]` — nothing — while type-checking perfectly and staying green under `tsd`. `<P extends LeafPath<T>>(...p: P[])` keeps completions but unifies `P` across the arguments, so the *second* position then offers only the literal already typed in the first. Only a plain `(...p: LeafPathOrPattern<T>[])` offers every leaf path at every position, which is why `pickLeaves`/`omitLeaves`/`mask().pick` take that shape and `mask()` carries **no** accumulated path union. Anyone wanting the narrowed type writes `PickLeaves<Order, 'a' | 'b'>`, which is nearly free (+1.2 instantiations per member).
5. **`Array.isArray()` applied directly to a `Fragment<T>` return trips trap 2.** `Fragment<T>` is `T | RecursivePartial<T>` and `Array.isArray` narrows through `any[]`, which forces `RecursivePartial` to resolve while `T` is still being inferred. Bind the result to a variable first. Not pinned as a `tsd` case — `expectError` cannot assert ts2589 — so this note and the comment in `__tests__/accessors/mask.test.ts` are the guard. Note that vitest would never catch it; `npm run typecheck` is what does.

**Annotate a per-leaf registry; do not use `satisfies`.** `Record<LeafPath<T>, X>` is the
exhaustive-map trick — a missing key is a compile error, and it costs ~1.2 type
instantiations per entry, making it the cheapest thing in the library. But the two spellings
are not interchangeable: `satisfies` keeps only the literal keys in the resulting type, so
indexing with a `LeafPath<T>`-typed variable fails with *"Element implicitly has an 'any'
type"*. The annotation keeps the interpolated member as an index signature and indexes fine.
Use `satisfies` only for a map nothing looks up dynamically.

`PickLeaves`/`OmitLeaves` do use `LeafPath<T> | (string & {})`, which looks like trap 1 but is not it. The trap is a loose **overload** on a mutating call, where any string matches and the strict signature never gets to fail. Here the loose half sits in a **constraint** whose only job is to keep subtree patterns (`` `customer.${string}` ``) assignable while the `LeafPath<T>` half keeps completions alive — a bare `string` swallows the union and the editor offers nothing. The residual cost is narrow and documented in the JSDoc: `OmitLeaves` with a path that matches nothing removes nothing instead of failing. `PickLeaves` yields `never`, which is loud.

## Conventions

- **Relative imports must carry the `.js` extension** (`./diff.js`), even from `.ts` sources — ESM + `moduleResolution: "Bundler"`.
- **Cross-directory imports use path aliases**, never relative parent paths. ESLint's `no-restricted-imports` bans `..*` and deep alias imports (`@typings/*.js`) inside `src/**` and `utils/**`, forcing everything through each folder's `index.ts` barrel. Aliases: `@accessors`, `@typings`, `@utils/*` (see `tsconfig.json` `paths`). Test files may import deep paths.
- Adding a new public entry point means updating three places: `vite.config.ts` `rollupOptions.input`, the `exports` map in `package.json`, and the relevant barrel.
- No runtime dependencies. The object helpers the accessors need — `getByPath`, `isObject`, `last` — live in `utils/objects.ts`; extend that file rather than pulling a library back in. `vite.config.ts` still externalizes `pkg.dependencies`, so adding one later keeps it out of the bundle.
- Commit messages follow Conventional Commits — **release-please** reads them. There is no local release command; see "Releasing" below.
- A `BREAKING CHANGE:` note runs to the **end of the commit body**, so anything after it — `Co-Authored-By`, `Refs`, any trailer — is copied verbatim into the public changelog. Put the note last and keep trailers out of a breaking commit. When an entry still needs fixing up, edit `CHANGELOG.md` on the release PR's branch rather than after the fact, as 0.4.0 had to be hand-written.
- `.gitignore` includes `*.js` — never commit compiled output; source is `.ts` only.
- README examples are verified, not illustrative: type claims by `tsd`, runtime claims against the built bundle. Keep them that way when editing.
