import { LeafPath } from '@typings';

export default function parsePath(path: string) {
  return split(path).map(
    (x) =>
      [x.key, ...(x.indices?.map((i) => i.toString()) ?? [])].filter(
        (x) => x !== undefined,
      ) as string[],
  );
}

const pointsReg = /(?<!\\)\./,
  keyIndicesReg = /^(?<key>.*?)(?<indices>(?:(?<!\\)\[\d*(?<!\\)\])+)?$/,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _bracketsReg = /(?<!\\)\[(\d*)(?<!\\)\]/g;

/** Split path by dots and then bracket pairs, except when preceded by backslash
 * @returns each dotted subpath: the root key and its indices.
 * Both the root key and the indices can be `undefined`, but not both at the same time.
 */
export function split(path: string) {
  if (path === '') throw new Error('empty path keys are not supported!');
  const result: SubPath[] = [];
  for (const keyIndices of path.split(pointsReg)) {
    const match = keyIndicesReg.exec(keyIndices)!;
    const groups = match.groups!;
    const rootKey = groups.key === '' ? undefined : groups.key;
    const indices = groups.indices
      ?.replaceAll('[]', '[0]')
      .match(/\d+/g)
      ?.map((i) => parseInt(i));
    result.push({ key: rootKey, indices } as SubPath);
  }
  return result;
}

export function interpretPathHints<T extends object>(path: LeafPath<T>) {
  return split(path)
    .map(
      (x) => (x.key ?? '') + (x.indices?.map((i) => `[${i}]`).join('') ?? ''),
    )
    .join('.') as LeafPath<T>;
}

export type SubPath =
  | { key?: string; indices: number[] }
  | { key: string; indices?: number[] };
