import _ from 'lodash';
import { DottedPath, split } from './parsePath.js';

export function dottedPathToTree(root: Ref, dotPath: DottedPath) {
  let ref: Ref = root;
  if (dotPath.rootKey !== undefined && !Array.isArray(ref)) {
    ref[dotPath.rootKey] ??= {};
    const newRef = ref[dotPath.rootKey];
    if (isArrayOrObject(newRef)) ref = newRef;
    else throw new Error();
  } else {
    throw new Error(`${dotPath.rootKey} && ${!Array.isArray(ref)} = false`);
  }

  return ref;
}

export function reconstruct(root: Ref, dotPath: DottedPath) {
  const refs = buildRefs(root, dotPath)
    .slice(1) // remove root ref
    .filter((x) => x !== undefined);
  const keys = [dotPath.rootKey, ...(dotPath.indices ?? [])].filter(
    (x) => x !== undefined,
  );
  if (keys.length !== refs.length) throw new Error();
  let ref = root;
  for (let i = 0; i < keys.length; i++) {
    ref[keys[i]] = refs[i];
    ref = refs[i];
  }
  return root;
}

export function buildRefs(root: Ref, dotPath: DottedPath) {
  const refs = getOuterRefs(root, dotPath);
  if (!hasTypeCollision(refs, dotPath)) throw new Error();
  if (dotPath.rootKey !== undefined) {
    refs[1] ??= {};
  }
  if (dotPath.indices !== undefined) {
    for (let i = 2; i < refs.length - 1; i++) {
      refs[i] ??= [];
    }
  }
  refs[refs.length - 1] = {};
  return refs;
}

export function hasTypeCollision(
  refs: ReturnType<typeof getOuterRefs>,
  dotPath: DottedPath,
) {
  let valid = true;
  if (dotPath.rootKey !== undefined)
    valid &&= _.isObject(refs[0]) && !_.isArray(refs[0]);
  else valid &&= _.isArray(refs[0]);
  if (dotPath.indices !== undefined) {
    valid &&= refs.slice(2, -1).every((x) => _.isArray(x) || x === null);
    valid &&= !_.isArray(refs.slice(-1)[0]);
  }
  return valid;
}

export function getOuterRefs(root: Ref, dotPath: DottedPath) {
  const key = dotPath.rootKey,
    indices = dotPath.indices ?? [];
  const rootValue = root[key];
  const firstArray = key !== undefined ? rootValue : root;
  const arrays = indices
    .reduce(
      (refs, key) => [...refs, refs.slice(-1)[0]?.[key] ?? null],
      [firstArray],
    )
    .slice(1);
  return [root, rootValue].concat(arrays);
}

function isArrayOrObject(ref: unknown): ref is Ref {
  return typeof ref === 'object';
}

type Ref = UnknownArray | UnknownRecord;
type UnknownArray = Array<unknown>;
type UnknownRecord = Record<string | number | symbol, unknown>;
