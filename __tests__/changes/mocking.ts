import _ from 'lodash';
import { Changes } from '../../src/changes/Changeable.js';
import { Fragment } from '../../src/index.js';

export let VAL: {
  source: TestCase;
  target: TestCase;
  sourceChanges: Changes<TestCase>;
  targetChanges: Changes<TestCase>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

// Accessible through sourceChanges.['original' | 'proposed']
const initialOriginals: Fragment<TestCase> = Object.freeze({
  prop: 'original',
  other: 200,
});
const initialProposal: Fragment<TestCase> = Object.freeze({
  prop: 'new',
});

export function resetInitialValues() {
  const source = {
    prop: 'prop',
    other: 42,
    leavemealone: true,
  };
  const target = _.cloneDeep(source);
  VAL = {
    source,
    target,
    sourceChanges: new Changes(source),
    targetChanges: new Changes(target),
  };
}
resetInitialValues();

export function mockOriginals(value?: Fragment<TestCase>) {
  VAL.sourceChanges.original = { ...(value ?? initialOriginals) };
  VAL.targetChanges.original = { ...(value ?? initialOriginals) };
}
export function mockProposal(value?: Fragment<TestCase>) {
  VAL.sourceChanges.proposed = { ...(value ?? initialProposal) };
  VAL.targetChanges.proposed = { ...(value ?? initialProposal) };
}

export type TestCase = { prop: string; leavemealone: boolean; other: number };
