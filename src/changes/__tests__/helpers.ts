import _ from 'lodash';
import { Changes } from '../Changeable.js';
import { Fragment } from '../../index.js';

export type TestCase = { prop: string; leavemealone: boolean; other: number };
const originals: Fragment<TestCase> = {
  prop: 'original',
  other: 43,
};

export function initialValues() {
  const source: TestCase = {
    prop: 'prop',
    other: 42,
    leavemealone: true,
  };
  const target = _.cloneDeep(source),
    sourceChanges = new Changes(source),
    targetChanges = new Changes(target);

  function mockOriginals() {
    sourceChanges.original = { ...originals };
    targetChanges.original = { ...originals };
  }

  return {
    source,
    target,
    sourceChanges,
    targetChanges,
    originals,
    mockOriginals,
    [Symbol.dispose]: () => {},
  };
}
