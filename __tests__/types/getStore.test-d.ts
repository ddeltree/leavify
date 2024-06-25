/* eslint-disable */

import { getOriginal, getProposed } from '@changes/getStore.js';
import { expectType } from 'tsd';

const ob = {
  id: 'abc',
  sub: [1, { prop: 42 }] as const,
};

expectType<42 | undefined>(getOriginal(ob).sub?.[1]?.prop);
expectType<string | undefined>(getProposed(ob).id);
