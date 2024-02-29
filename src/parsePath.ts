// TODO rewrite
export default function parsePath(path: string) {
  return split(path).map((x) =>
    [x.rootKey, ...(x.indices?.map((i) => i.toString()) ?? [])].filter(
      (x) => x,
    ),
  );
}

const pointsReg = /(?<!\\)\./,
  keyIndicesReg = /^(?<rootKey>.*?)(?<indices>(?:(?<!\\)\[\d*(?<!\\)\])+)?$/,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _bracketsReg = /(?<!\\)\[(\d*)(?<!\\)\]/g;

/** Split path by dots and then bracket pairs, except when preceded by backslash
 * @returns each dotted subpath: the root key and its indices.
 * Both the root key and the indices can be `undefined`, but not both at the same time.
 */
export function split(path: string) {
  const result: { rootKey?: string; indices?: number[] }[] = [];
  for (const keyIndices of path.split(pointsReg)) {
    const match = keyIndicesReg.exec(keyIndices)!;
    const groups = match.groups as Partial<
      Record<'rootKey' | 'indices', string>
    >;
    const rootKey = groups.rootKey === '' ? undefined : groups.rootKey;
    const indices = groups.indices
      ?.replace('[]', '[0]')
      .match(/\d+/g)
      ?.map((i) => parseInt(i));
    result.push({ rootKey, indices });
  }
  return result;
}
