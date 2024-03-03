import _ from 'lodash';
import { DottedPath, split } from './parsePath.js';
import { Primitive } from './types/Leaves.js';

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

type Refs = ReturnType<typeof getBindingRefMap>;

export function hasTypeCollision(refs: ReturnType<typeof getBindingRefMap>) {
  const dottedRefs = new DottedRefs(refs);
  let isValid = true;
  isValid &&= dottedRefs.arrays.every((x) => _.isArray(x) || x === undefined);
  isValid &&= !_.isArray(dottedRefs.lastRef);
  return !isValid;
}

class DottedRefs {
  readonly arrays: UnknownArray[];
  readonly lastRef: UnknownRecord | Primitive;
  constructor(public readonly refs: Refs) {
    let innerRefs = [];
    if (refs.keyRef !== undefined) innerRefs.push(refs.keyRef[1]);
    if (refs.indexRefs !== undefined)
      innerRefs = innerRefs.concat(refs.indexRefs.map((x) => x[1]));
    this.arrays = innerRefs.slice(0, -1) as UnknownArray[];
    this.lastRef = innerRefs.slice(-1)[0] as UnknownRecord | Primitive;
  }
}

type Ref = UnknownArray | UnknownRecord;
type UnknownArray = Array<unknown>;
type UnknownRecord = Record<string | number | symbol, unknown>;
