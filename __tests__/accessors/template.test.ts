import { describe, expect, test } from 'vitest';
import { toTemplate } from '@accessors/template.js';
import diff from '@accessors/diff.js';
import type { LeafPath } from '@typings';
import { errorsIn } from '../types/languageService.js';
import walkLeaves from '@accessors/walkLeaves.js';
import { compileMatcher } from '@utils/pathPattern.js';
import { interpretPathHints } from '@utils/parsePath.js';

/** `template.ts` and `TemplatePath.ts` are two implementations of one rewrite —
 * one in JavaScript, one in the type system. This table feeds both, so neither
 * half can drift without a test going red. Every expectation is written by
 * hand; deriving one by calling the code would agree with it by construction. */
const TO_TEMPLATE: [path: string, template: string][] = [
  // the headline case: an index collapses to the spelling an editor can offer
  ['items[1].qty', 'items[].qty'],
  ['items[10].qty', 'items[].qty'],
  ['[3].a', '[].a'],
  ['a[0][2].b', 'a[][].b'],
  ['x[10][0]', 'x[][]'],
  // already a template: idempotent rather than an error
  ['items[].qty', 'items[].qty'],
  // nothing to collapse
  ['a.b.c', 'a.b.c'],
  ['id', 'id'],
  // `$`/`#` are the `LeafPath<T, true>` hint suffixes; only index groups are
  // touched here, and `interpretPathHints` does not strip them either
  ['tags$.x', 'tags$.x'],
  // `[x]` is not an index group — `keyIndicesReg` reads it as part of the key
  ['a[x].b', 'a[x].b'],
  // escaped brackets belong to the key: this one is literally keyed `a[0]`
  ['a\\[0\\].b', 'a\\[0\\].b'],
  // an escaped closing bracket leaves the group incomplete
  ['a[0\\].b', 'a[0\\].b'],
  // THE discriminating row: an escaped OPENING bracket with an ordinary
  // closing one. This is the only shape where `bracketsReg`'s lookbehind
  // changes the answer — a naive /\[\d*\]/ rewrites it to `a\[].b` and
  // corrupts a key literally named `a[0`. Every other escaping row below
  // passes under both implementations, so without this one they are decoration.
  ['a\\[0].b', 'a\\[0].b'],
  // and the library-wide reading of a doubled backslash: the lookbehind sees a
  // backslash before `[` and stops, so this is one key, not an index
  ['a\\\\[0].b', 'a\\\\[0].b'],
  // an escaped dot inside a key does not block the index after it
  ['a\\.b[2].c', 'a\\.b[].c'],
  // an escaped bracket must not stop the scan: the later index still collapses
  ['a\\[0].b[2].c', 'a\\[0].b[].c'],
];

describe('toTemplate()', () => {
  test.each(TO_TEMPLATE)('%s -> %s', (path, template) => {
    expect(toTemplate(path)).toBe(template);
  });

  test('is idempotent, so a template survives a second pass', () => {
    for (const [path] of TO_TEMPLATE)
      expect(toTemplate(toTemplate(path))).toBe(toTemplate(path));
  });

  test('two consecutive calls agree, pinning the shared global regex', () => {
    // `bracketsReg` carries the /g flag and is shared with `pathPattern.ts`.
    // An implementation that kept a stateful `lastIndex` would pass once.
    expect(toTemplate('items[1].qty')).toBe('items[].qty');
    expect(toTemplate('items[1].qty')).toBe('items[].qty');
  });
});

/** The reason this function exists. A per-leaf registry is keyed by the
 * completable spelling, because that is what `LeafPath<T>` offers as a literal;
 * `diff` and `walkLeaves` yield a concrete index. Looking one up with the other
 * type-checks and returns `undefined`. */
describe('a per-leaf registry, indexed by a path from diff', () => {
  interface Order {
    id: string;
    items: { qty: number }[];
  }
  // Annotated, not `satisfies`. Both reject a missing key, but `satisfies`
  // keeps only the literal keys in the resulting type, so indexing it with a
  // `LeafPath<Order>` fails to compile. The annotation keeps the interpolated
  // member as an index signature, which is what makes the lookup legal.
  const labels: Record<LeafPath<Order>, string> = {
    id: 'Reference',
    'items[].qty': 'Quantity',
  };

  const saved: Order = { id: 'o-1', items: [{ qty: 1 }, { qty: 2 }] };
  const edited: Order = { id: 'o-1', items: [{ qty: 1 }, { qty: 9 }] };

  test('diff yields a concrete index, not the completable spelling', () => {
    expect([...diff(saved, edited)]).toEqual([['items[1].qty', 2, 9]]);
  });

  test('the raw lookup misses, silently', () => {
    const [[path]] = [...diff(saved, edited)];
    expect(labels[path]).toBeUndefined();
  });

  test('toTemplate is what makes it hit', () => {
    const [[path]] = [...diff(saved, edited)];
    expect(labels[toTemplate(path)]).toBe('Quantity');
  });
});

/** A string literal as it has to be spelled inside generated TypeScript source:
 * a backslash in the value is two in the snippet. */
const lit = (value: string) => `'${value.replaceAll('\\', '\\\\')}'`;

const PRELUDE = `import { toTemplate } from '@accessors';\n`;

describe('the rewrite holds at the type level, on the same table', () => {
  const assertions = (suffix = '') =>
    TO_TEMPLATE.map(
      ([path, template], i) =>
        `const a${i}: ${lit(template + suffix)} = toTemplate(${lit(path)});`,
    );

  test('every case resolves to the literal the runtime produces', () => {
    expect(errorsIn(PRELUDE + assertions().join('\n'))).toEqual([]);
  });

  test('and a wrong expectation fails, so the check above is not vacuous', () => {
    // Without this, a rewrite that resolved to `never` would satisfy every
    // assertion above — `never` is assignable to anything.
    expect(errorsIn(PRELUDE + assertions('~X').join('\n'))).toHaveLength(
      TO_TEMPLATE.length,
    );
  });
});

describe('paths that are not fully literal', () => {
  test('the interpolated member collapses, which is the whole point', () => {
    // `LeafPath<T>` carries both `items[].qty` and `items[${number}].qty`. The
    // second is the one a registry lookup misses on, and it is the same
    // `[${number}]` to the compiler as a literal index, so one rule covers both.
    expect(
      errorsIn(`${PRELUDE}
        declare const interpolated: \`items[\${number}].qty\`;
        declare const nested: \`m[\${number}][\${number}].v\`;
        const a: 'items[].qty' = toTemplate(interpolated);
        const b: 'm[][].v' = toTemplate(nested);
      `),
    ).toEqual([]);
  });

  test('a key hole is left alone, since it is not an index', () => {
    expect(
      errorsIn(`${PRELUDE}
        declare const key: \`tags.\${string}\`;
        const a: \`tags.\${string}\` = toTemplate(key);
      `),
    ).toEqual([]);
  });

  test('a dynamic path widens to string rather than collapsing to never', () => {
    expect(
      errorsIn(`${PRELUDE}
        declare const dynamic: string;
        const a: string = toTemplate(dynamic);
      `),
    ).toEqual([]);
  });

  test('a union rewrites member by member', () => {
    expect(
      errorsIn(`${PRELUDE}
        declare const path: 'a.b' | 'items[3].qty';
        const a: 'a.b' | 'items[].qty' = toTemplate(path);
      `),
    ).toEqual([]);
  });
});

/** The template form of a leaf is exactly the mask rule for that leaf's family.
 * This is the one assertion that pins the whole design: `[]` means "any index"
 * in a rule, and `toTemplate` produces precisely that spelling. */
describe('the template form is a mask rule for the leaf family', () => {
  const model = {
    id: 'o-1',
    rows: [{ sku: 'a' }, { sku: 'b' }, { sku: 'c' }],
    nested: { deep: { value: 1 } },
  };

  test('a leaf is matched by the rule its own template makes', () => {
    for (const [path] of walkLeaves(model))
      expect(compileMatcher([toTemplate(path)])(path)).toBe(true);
  });

  test('and so is every sibling differing only in its index', () => {
    const rule = compileMatcher([toTemplate('rows[0].sku')]);
    expect(rule('rows[0].sku')).toBe(true);
    expect(rule('rows[1].sku')).toBe(true);
    expect(rule('rows[2].sku')).toBe(true);
    expect(rule('other[0].sku')).toBe(false);
  });

  test('it is invariant under the `[]` normalisation, not its inverse', () => {
    // `split()` maps `[]` to `[0]`; `toTemplate` maps `[n]` to `[]`. They are
    // two many-to-one quotients in opposite directions, so composing them is
    // not the identity — `toTemplate(interpretPathHints(p))` is the honest
    // invariant, and `interpretPathHints(toTemplate(p)) === p` is not.
    // `interpretPathHints` needs the model explicitly: with nothing to infer
    // `T` from it lands on `LeafPath<object>`, which is `never`.
    type Rows = { rows: { sku: string }[] };
    expect(toTemplate(interpretPathHints<Rows>('rows[].sku'))).toBe(
      toTemplate('rows[].sku'),
    );
    expect(interpretPathHints<Rows>(toTemplate('rows[2].sku'))).toBe(
      'rows[0].sku',
    );
  });
});
