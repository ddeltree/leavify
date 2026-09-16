import { describe, expect, test } from 'vitest';
import { compileMatcher } from '@utils/pathPattern.js';

/** One literal row per rule. The expectations are written by hand rather than
 * derived from the matcher: an expected value computed the way the code
 * computes it agrees by construction and can never disagree with a bug.
 *
 * Every row carries a `rejects` list for the same reason `pointer.test.ts`
 * carries a negative pass — a matcher that said "yes" to everything would
 * satisfy every positive row in silence. */
const table: {
  rule: string;
  pattern: string;
  matches: string[];
  rejects: string[];
}[] = [
  {
    rule: 'an exact leaf path matches only itself',
    pattern: 'customer.name',
    matches: ['customer.name'],
    rejects: ['customer.nameSuffix', 'customer', 'id'],
  },
  {
    rule: 'a subtree prefix matches every leaf under it',
    pattern: 'customer',
    matches: ['customer.name', 'customer.address.city'],
    rejects: ['id'],
  },
  {
    rule: 'the [] wildcard stands for any index, unlike split() where it is 0',
    pattern: 'rows[]',
    matches: ['rows[0].sku', 'rows[7].sku', 'rows[0]'],
    rejects: ['rowsX[0].sku', 'rows'],
  },
  {
    rule: 'a concrete index matches only itself',
    pattern: 'rows[0]',
    matches: ['rows[0].sku'],
    rejects: ['rows[1].sku'],
  },
  {
    // Stripped, a hint rule is exactly its bare prefix — `tags$` and `tags`
    // behave identically. Whether it also matches a leaf literally named `tags`
    // is unobservable: in any model where `tags$` is a legal hint, `tags` is a
    // Record, so `walkLeaves` never emits it as a leaf.
    rule: 'a $ hint suffix is stripped, because the accessors do not strip it',
    pattern: 'tags$',
    matches: ['tags.a', 'tags.b.c'],
    rejects: ['tagsX.a', 'tagsX'],
  },
  {
    rule: 'a # hint suffix is stripped the same way',
    pattern: 'slots#',
    matches: ['slots.0', 'slots.12'],
    rejects: ['slotsX.0'],
  },
  {
    rule: 'a prefix stops at a segment boundary, so it is not a substring match',
    pattern: 'customer',
    matches: ['customer.name'],
    rejects: ['customerId', 'customerId.name', 'custom'],
  },
];

describe.each(table)('$rule', ({ pattern, matches, rejects }) => {
  const allows = compileMatcher([pattern]);

  test.each(matches)(`'${pattern}' matches %s`, (path) => {
    expect(allows(path)).toBe(true);
  });

  test.each(rejects)(`'${pattern}' rejects %s`, (path) => {
    expect(allows(path)).toBe(false);
  });
});
