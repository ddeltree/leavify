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
npm run release               # standard-version (conventional commits -> CHANGELOG + tag)
```

`npm run typecheck` (`tsconfig.typecheck.json`) is the gate for everything vitest only transpiles. Vitest does not type-check, so a type regression in a runtime test file is invisible to `npm test` — that is how a broken `toTree` call sat green. The config excludes `__tests__/types/*.test-d.ts`, since those are full of deliberate errors that `tsd` owns.

`npm test` dispatches through `test.sh`, which switches on `--types` / `--package` flags. `--types` requires `dist/src/index.d.ts` to exist (it touches an empty one if missing) because tsd resolves the package's declared `types` field. `--package` runs against the *built* artifact via `npm link`, so it catches packaging/export-map regressions that unit tests can't.

CI (`.github/workflows/test.yml`) runs build → unit → package → types on push/PR to `main`.

## Architecture

### Path grammar

Paths are strings mixing dot and bracket notation: `chapters[0].title`, `values[]`, `[1][2]`. `utils/parsePath.ts` is the single parser:

- `split()` splits on unescaped `.` then unescaped `[n]` groups; `[]` normalizes to `[0]`.
- `parsePath()` returns groups of keys — one group per dot-segment, with the root key followed by its indices. `setUnchecked()` relies on this grouping to know whether to create `{}` or `[]` for a missing intermediate node.
- `interpretPathHints()` strips the autocomplete hint suffixes (`$`, `#`) that `LeafPath<T, true>` emits for `Record<string, _>` / `Record<number, _>` index signatures. Every public accessor calls it, then tokenizes with `parsePath()` before walking the object.

A "leaf" is any non-object value **plus `null`** — see the `switch` in `has()`. Functions and symbols are not leaves.

Two escaping layers exist and they reserve *different* characters. Leavify's grammar reserves `.`, `[`, `]`, `\`; RFC 6901 reserves `~` and `/`. A key containing `/` needs no leavify escape; a key containing `.` needs no pointer escape. `pointer.ts` translates between them — `toPointer` unescapes the leavify layer before emitting.

### `src/accessors/`

Runtime primitives, all path-based:

- `accessors.ts` — `get` (typed as the leaf at that path), `has`, `set` (value checked against the path), `setUnchecked` (escape hatch for runtime-built paths; `set` delegates to it).
- `walkLeaves.ts` — generator over leaf entries, cycle-guarded by the `Branch` value stack. Yields `LeafEntry<T>`, a discriminated union over the path (same shape as `LeafDiff`), so the value narrows with the path.
- `toTree.ts` — entries → new object; root is an array if the first path starts with `[`. Generic over the model, which must be passed explicitly (`toTree<Order>(…)`) because `LeafPath<T>` is not an inferable position. The `T = never` default routes unannotated calls to a plain `[string, Primitive]` entry, deliberately keeping `LeafEntry` off that path: `LeafEntry` of an index-signature model distributes over `` `${string}` `` and trips *"type instantiation is excessively deep"* (trap 2 below). `diff` binds `walkLeaves` to `T` rather than `T | Fragment<T>` for the same reason.
- `diff.ts` — yields `[path, before, after]` as `LeafDiff<T>`, a discriminated union over the path. Only visits leaves reachable in `after`, so removals are not reported; a leaf absent from `before` yields `undefined`.
- `pointer.ts` — `toPointer` / `fromPointer` for RFC 6901 interop.

### `src/types/`

The type-level half of the library, and the hard part.

`LeafPath<T, HINT>` is built from `Refs<T>` — a recursive mapped type producing tuples of `[key, parent]` pairs down to each leaf — then stringified by `ToString`. It guards against infinite recursion by excluding children already seen in the chain (`CHILD extends ROOT | PARENT | CHAIN[number][1]`), which is why genuinely cyclic types terminate structurally instead of at a fixed depth.

`LeafValue<T, P>` indexes the same `Refs<T>` by path: `MatchChain` distributes over the union of chains, keeps the ones whose `ToString` matches `P`, and `ChainValue` reads the type off the last pair. Omitting `P` yields the union of every leaf type.

`Hidden.ts` holds the path-space exclusion marker — a `declare const` unique symbol, so it exists only in the types and emits no runtime code. A field typed `Hidden<T>` is dropped from `Refs` via `HiddenKeys`, so it never appears in any path. `PickLeaves`/`OmitLeaves` do the same narrowing per use site instead of per declaration.

Changes here are easy to get subtly wrong, and they are covered by **two** suites that check different properties:

- `__tests__/types/*.test-d.ts` (tsd, `npm run test -- --types`) — assignability: does this path resolve to this type, is this one rejected.
- `__tests__/types/completions.test.ts` (vitest, part of the normal run) — **what an editor offers at the cursor**, via the real TypeScript language service over a virtual file (`__tests__/types/languageService.ts`).

The second suite exists because the first one structurally cannot catch a missing completion. A type parameter constrained to `string` type-checks every call while offering no suggestion at all, so an assignability suite stays green while autocompletion — the headline feature — is broken. That is exactly how `PickLeaves`/`OmitLeaves` shipped with zero completions. Any new public API that takes a path needs a case in *both*.

**Watch for two traps that already bit once:**

1. A loose overload on `set` (`[string & {}, Primitive]`) silently defeats value checking — every string matches it, so the strict signature never fails. That is why the escape hatch is a separate `setUnchecked` function, not an overload. `__tests__/types/LeafValue.test-d.ts` catches the regression.
2. `LeafValue<T, P>` instantiated with `P` at its full constraint is O(paths × chains) and can trip *"type instantiation is excessively deep"*. Keep it inferred from a concrete argument.

`PickLeaves`/`OmitLeaves` do use `LeafPath<T> | (string & {})`, which looks like trap 1 but is not it. The trap is a loose **overload** on a mutating call, where any string matches and the strict signature never gets to fail. Here the loose half sits in a **constraint** whose only job is to keep subtree patterns (`` `customer.${string}` ``) assignable while the `LeafPath<T>` half keeps completions alive — a bare `string` swallows the union and the editor offers nothing. The residual cost is narrow and documented in the JSDoc: `OmitLeaves` with a path that matches nothing removes nothing instead of failing. `PickLeaves` yields `never`, which is loud.

## Conventions

- **Relative imports must carry the `.js` extension** (`./diff.js`), even from `.ts` sources — ESM + `moduleResolution: "Bundler"`.
- **Cross-directory imports use path aliases**, never relative parent paths. ESLint's `no-restricted-imports` bans `..*` and deep alias imports (`@typings/*.js`) inside `src/**` and `utils/**`, forcing everything through each folder's `index.ts` barrel. Aliases: `@accessors`, `@typings`, `@utils/*` (see `tsconfig.json` `paths`). Test files may import deep paths.
- Adding a new public entry point means updating three places: `vite.config.ts` `rollupOptions.input`, the `exports` map in `package.json`, and the relevant barrel.
- No runtime dependencies. The object helpers the accessors need — `getByPath`, `isObject`, `last` — live in `utils/objects.ts`; extend that file rather than pulling a library back in. `vite.config.ts` still externalizes `pkg.dependencies`, so adding one later keeps it out of the bundle.
- Commit messages follow Conventional Commits (`standard-version` generates the changelog from them).
- `.gitignore` includes `*.js` — never commit compiled output; source is `.ts` only.
- README examples are verified, not illustrative: type claims by `tsd`, runtime claims against the built bundle. Keep them that way when editing.
