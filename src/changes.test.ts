import { Change, findChanges } from './changes';

test('', () => {
  const original = {
      a: 'x',
    },
    fragment = {
      a: 'y',
    };
  expect(findChanges(original, fragment)).toEqual({
    a: {
      original: original.a,
      change: fragment.a,
    } as Change,
  });
});
