import { describe, expect, it } from 'vitest';
import { diff, get, has, omitLeaves, pickLeaves, walkLeaves } from '@accessors';
import toTree from '@accessors/toTree.js';
import type { Hidden } from '@typings';

/** `Hidden` is a types-only brand — `Hidden.ts` declares the symbol without
 * constructing it, so nothing about it survives to runtime. These tests pin
 * where that boundary actually falls, because the guarantee is real on one side
 * of it and absent on the other. */

interface Account {
  email: string;
  passwordHash: Hidden<string>;
  profile: { nickname: string; ssn: Hidden<string> };
}
// A `Hidden<T>` field is `T` intersected with a phantom marker, so a literal
// cannot be written for one without asserting past the marker.
const account = (): Account => ({
  email: 'a@b.c',
  passwordHash: 'sha256:deadbeef' as Account['passwordHash'],
  profile: {
    nickname: 'ab',
    ssn: '000-00-0000' as Account['profile']['ssn'],
  },
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
    expect(entries.map(([path]) => path)).toEqual([
      'email',
      'passwordHash',
      'profile.nickname',
      'profile.ssn',
    ]);
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

describe('a mask narrows the path space; it does not redact a Hidden field', () => {
  // The mask is the first API that *could* look like redaction, so where it
  // stops matters more here than anywhere else.

  it('an allow-list of exact paths drops it — but only because it is unnameable', () => {
    // Not a runtime guarantee. `passwordHash` is absent from `LeafPath<Account>`
    // and so is never offered as a completion; that is a typing property, and
    // the two tests below are what it costs.
    expect(pickLeaves(account(), 'email')).toEqual({ email: 'a@b.c' });
  });

  it('naming it outright works, since the pattern half accepts any string', () => {
    // `LeafPathOrPattern` is `LeafPath<T> | (string & {})`. The second half is
    // what keeps patterns and runtime-built rules assignable, and it also means
    // nothing stops a caller from asking for a hidden field by name.
    expect(pickLeaves(account(), 'passwordHash')).toEqual({
      passwordHash: 'sha256:deadbeef',
    });
  });

  it('a subtree prefix sweeps it in, which is the sharp edge', () => {
    // `profile.ssn` is Hidden, yet picking the whole `profile` subtree keeps it:
    // the prefix rule is structural and the marker is invisible at runtime.
    expect(pickLeaves(account(), 'profile')).toEqual({
      profile: { nickname: 'ab', ssn: '000-00-0000' },
    });
  });

  it('omitLeaves leaks it, because walkLeaves still yields it', () => {
    const view = omitLeaves(account(), 'email') as Account;
    expect(view.passwordHash).toBe('sha256:deadbeef');
  });
});
