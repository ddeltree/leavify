export default function parsePath(path: string) {
  // split by dots or bracket pairs, except when preceded by backslash
  const points = /(?<!\\)\./;
  const brackets = /(?<!\\)\[(.*?)(?<!\\)\]/;
  // a[1][2].b ==> [['a', '1', '2'], ['b']]
  // group keys by whether they refer to directly nested array or object keys
  // --> object key   ==> single-element array, with the key
  // --> arr[][][]... ==> > 2 elements; the last one is an object key
  const groups: string[][] = [];
  for (const sub of path.split(points)) {
    const match = sub.split(brackets);
    // .any.
    if (match.length === 1) {
      groups.push([match[0]]);
      continue;
    }
    // .any[number].
    const keys = match.filter((x) => x); // ignore empty ones (from the brackets)
    if (keys.length === 1 && isNaN(parseInt(keys[0])))
      throw new Error(
        `The notation '.[string].' is not supported
          Use '.string.' instead`,
      );
    else if (keys.slice(1).some((x) => isNaN(parseInt(x))))
      throw new Error(
        `The notation 'array[string]' is not supported, only for numbers.
          Use 'any.string' instead.`,
      );
    groups.push(keys);
  }
  return groups;
}
