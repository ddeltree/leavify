import _ from 'lodash';
import { SubPath as SubPath, split } from './parsePath.js';
import { Primitive } from './types/Leaves.js';

export function reconstruct(root: Ref, dotPath: SubPath) {
  const refs = createMissingRefs(root, dotPath)
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

export function createMissingRefs(refs: BindingRefs) {
  if (hasTypeCollision(refs)) throw new Error();
  if (refs.keyRef) refs.keyRef[1] ??= {};
  if (refs.indexRefs) {
    for (let i = 0; i < refs.indexRefs.length - 2; i++)
      refs.indexRefs[i][1] ??= [];
    refs.indexRefs[refs.indexRefs.length - 1] = {};
  }
  return refs;
}

export function getBindings(rootRef: Extract<Ref, object>, dotPath: SubPath) {
  const keys = [dotPath.key, ...(dotPath.indices ?? [])].filter(
    (x) => x !== undefined,
  ) as [string, ...number[]] | number[];
  const refs = keys
    .reduce((refs, key) => [...refs, getIndex(_.last(refs), key)], [rootRef])
    .slice(1);
  return refs.map((ref, i) => [keys[i], ref]);
}

export function isNoCollisionSubPath(
  rootRef: Extract<Ref, object>,
  dotPath: SubPath,
) {
  const bindings = getBindings(rootRef, dotPath);
  const refs = bindings.map(([_, ref]) => ref);
  const firstKey = bindings[0][0];
  let isValid = true;

  // ROOT
  if (typeof firstKey === 'string') {
    isValid &&= _.isObject(rootRef) && !_.isArray(rootRef);
  } else if (typeof firstKey === 'number') {
    isValid &&= _.isArray(rootRef);
  }
  // TRUNK
  isValid &&= refs
    .slice(1, -1)
    .every((ref) => ref === undefined || _.isArray(ref));

  // LEAF
  isValid &&= !_.isArray(_.last(bindings)![1]);
  return isValid;
}

function getIndex(ob: Ref, key: string | number) {
  return !ob || typeof ob !== 'object' || !Object.hasOwn(ob, key) ?
      undefined
    : (ob[key as any] as any);
}

type Ref = UnknownArray | UnknownRecord | Primitive;
type UnknownArray = Array<Ref>;
type UnknownRecord = Record<string | number | symbol, UnknownArray | Primitive>;
