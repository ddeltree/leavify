import _ from 'lodash';
import { DottedPath, split } from './parsePath.js';

export function reconstruct(root: Ref, dotPath: DottedPath) {
  const refs = buildRefs(root, dotPath)
    .slice(1) // remove root ref
    .filter((x) => x !== undefined);
  const keys = [dotPath.key, ...(dotPath.indices ?? [])].filter(
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
  const refs = getBindingRefMap(root, dotPath);
  if (!hasTypeCollision(refs, dotPath)) throw new Error();
  if (dotPath.key !== undefined) {
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
  refs: ReturnType<typeof getBindingRefMap>,
  dotPath: DottedPath,
) {
  let valid = true;
  if (dotPath.key !== undefined)
    valid &&= _.isObject(refs[0]) && !_.isArray(refs[0]);
  else valid &&= _.isArray(refs[0]);
  if (dotPath.indices !== undefined) {
    valid &&= refs.slice(2, -1).every((x) => _.isArray(x) || x === null);
    valid &&= !_.isArray(refs.slice(-1)[0]);
  }
  return valid;
}

export function getBindingRefMap(rootRef: Ref, dotPath: DottedPath) {
  const key = dotPath.key,
    indices = dotPath.indices;
  const keyRef = rootRef[key];
  const rootKeyRef = key !== undefined ? keyRef : rootRef;
  const indexRefs = indices
    ?.reduce(
      (refs, key) => [...refs, [key, _.last(refs)?.[1]?.[key]]],
      [[key, rootKeyRef]],
    )
    .slice(1);
  return {
    rootRef,
    indexRefs,
    keyRef: key !== undefined ? [key, keyRef] : undefined,
  };
}

type Ref = UnknownArray | UnknownRecord;
type UnknownArray = Array<unknown>;
type UnknownRecord = Record<string | number | symbol, unknown>;
