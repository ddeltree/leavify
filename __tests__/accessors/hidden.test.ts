import { describe, expect, it } from 'vitest';
import { diff, get, has, walkLeaves } from '@accessors';
import toTree from '@accessors/toTree.js';
import type { Hidden } from '@typings';

/** `Hidden` is a types-only brand — `Hidden.ts` declares the symbol without
 * constructing it, so nothing about it survives to runtime. These tests pin
 * where that boundary actually falls, because the guarantee is real on one side
 * of it and absent on the other. */

interface Account {
  email: string;
  passwordHash: Hidden<string>;
}
// A `Hidden<T>` field is `T` intersected with a phantom marker, so a literal
// cannot be written for one without asserting past the marker.
const account = (): Account => ({
  email: 'a@b.c',
  passwordHash: 'sha256:deadbeef' as Account['passwordHash'],
});

describe('a Hidden field is outside the path space', () => {
  it('is rejected by the path-taking accessors at compile time', () => {
    // @ts-expect-error — 'passwordHash' is not a LeafPath<Account>
    expect(() => has(account(), 'passwordHash')).not.toThrow();
    // @ts-expect-error — same
    expect(() => get(account(), 'passwordHash')).not.toThrow();
  });
});

describe('a Hidden field is still visited by the runtime walkers', () => {
  // The marker emits no runtime code, so a walker driven by Object.entries has
  // nothing to filter on. Hiding a field narrows the path space; it does not
  // redact the value. Anything that must not leave the object has to be kept
  // out of it, or removed before it reaches these functions.

  it('walkLeaves yields it, though its type says otherwise', () => {
    const entries = [...walkLeaves(account())];
    expect(entries).toContainEqual(['passwordHash', 'sha256:deadbeef']);
    // The declared element type is `readonly [LeafPath<Account>, Primitive]`,
    // and LeafPath<Account> is 'email' alone. The runtime value is wider.
    expect(entries.map(([path]) => path)).toEqual(['email', 'passwordHash']);
  });

  it('diff reports a change to it', () => {
    const edited = { ...account(), passwordHash: 'sha256:NEWHASH' as never };
    expect([...diff(account(), edited)]).toEqual([
      ['passwordHash', 'sha256:deadbeef', 'sha256:NEWHASH'],
    ]);
  });

  it('toTree carries it into the rebuilt object', () => {
    expect(toTree([...walkLeaves(account())])).toEqual(account());
  });
});
