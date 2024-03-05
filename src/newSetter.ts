/* eslint-disable */
import _ from 'lodash';
import { SubPath as SubPath, split } from './parsePath.js';
import { Primitive } from './types/Leaves.js';

export function safeReconstruct(root: Root, subPath: SubPath) {
  const bindings = getBindings(root as any, subPath);
  if (hasTypeCollision(root, bindings)) throw new Error();
  const refs = createMissingRefs(bindings).filter((x) => x !== undefined);
  const keys = [subPath.key, ...(subPath.indices ?? [])].filter(
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

export function getBindings(rootRef: Root, subPath: SubPath) {
  const keys = [subPath.key, ...(subPath.indices ?? [])].filter(
    (x) => x !== undefined,
  ) as [string, ...number[]] | number[];
  const refs = keys
    .reduce((refs, key) => [...refs, getIndex(_.last(refs), key)], [rootRef])
    .slice(1);
  return refs.map((ref, i) => [keys[i], ref]);
}

function getIndex(ob: Ref, key: string | number) {
  return !ob || typeof ob !== 'object' || !Object.hasOwn(ob, key) ?
      undefined
    : (ob[key as any] as any);
}

export function createMissingRefs(bindings: BindingRefs) {
  if (typeof _.first(bindings) === 'string') bindings[0][1] ??= {};
  for (let i = 0; i < bindings.length - 1; i++) {
    bindings[i][1] ??= [];
    // override leaf values along the way:
    // TODO validate for type collision
    if (!_.isObject(bindings[i][1])) bindings[i][1] = [];
  }
  bindings[bindings.length - 1][1] ??= {};
  return bindings;
}

export function hasTypeCollision(root: Root, bindings: BindingRefs) {
  const refs = bindings.map(([_, ref]) => ref);
  const firstKey = bindings[0][0];
  let isValid = true;

  // ROOT
  if (typeof firstKey === 'string') {
    isValid &&= _.isObject(root) && !_.isArray(root);
  } else if (typeof firstKey === 'number') {
    isValid &&= _.isArray(root);
  }

  // TRUNK
  isValid &&= refs
    .slice(1, -1)
    .every((ref) => ref === undefined || _.isArray(ref));

  // LEAF
  isValid &&= !_.isArray(_.last(bindings)![1]);
  return isValid;
}

type Root = Extract<Ref, object>;
type BindingRefs = ReturnType<typeof getBindings>;
type Ref = UnknownArray | UnknownRecord | Primitive;
type UnknownArray = Array<Ref>;
type UnknownRecord = Record<string | number | symbol, UnknownArray | Primitive>;
