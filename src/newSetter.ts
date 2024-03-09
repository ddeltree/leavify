/* eslint-disable */
import _ from 'lodash';
import { SubPath as SubPath, split } from './parsePath.js';
import { Primitive } from './types/Leaves.js';
import LeafPath from './types/LeafPath.js';

export function setSafely<T extends object>(
  ob: T,
  [path, value]: [LeafPath<T>, Primitive],
) {
  for (const subPath of split(path)) {
    console.log(subPath);
  }
}

export function strictReconstruct(root: Root, subPath: SubPath) {
  let bindings = getBindings(root as any, subPath);
  if (hasTypeCollision(root, bindings)) throw new Error();
  return reconstruct(root, subPath);
}

export function looseReconstruct(root: Root, subPath: SubPath) {
  return reconstruct(root, subPath);
}

function reconstruct(root: Root, subPath: SubPath) {
  let bindings = getBindings(root as any, subPath);
  if (!isValidRootKey(root, bindings)) throw new Error();
  createMissingRefs(bindings);
  bindings = bindings.filter((x) => x !== undefined);
  let ref = root;
  for (const binding of bindings) {
    ref[binding[0]] = binding[1];
    ref = binding[1];
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
  return refs.map((ref, i) => [keys[i], ref] as [string | number, Ref]);
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
    if (!_.isObject(bindings[i][1])) bindings[i][1] = [];
  }
  bindings[bindings.length - 1][1] ??= {};
}

export function hasTypeCollision(root: Root, bindings: BindingRefs) {
  let isValid = true;
  isValid &&= isValidRootKey(root, bindings);
  isValid &&= isNewBranch(bindings) || isExistingBranch(bindings);
  return !isValid;
}

function isNewBranch(bindings: BindingRefs) {
  return bindings.slice(1, -1).some(([, ref]) => ref === undefined);
}

function isExistingBranch(bindings: BindingRefs) {
  return (
    bindings.slice(1, -1).every(([, ref]) => _.isArray(ref)) &&
    !_.isArray(_.last(bindings)![1])
  );
}

function isValidRootKey(root: Ref, bindings: BindingRefs) {
  const key = bindings[0][0];
  let isValid = true;
  if (typeof key === 'string') isValid &&= _.isObject(root) && !_.isArray(root);
  else if (typeof key === 'number') isValid &&= _.isArray(root);
  return isValid;
}

type Root = Extract<Ref, object>;
type BindingRefs = ReturnType<typeof getBindings>;
type Ref = UnknownArray | UnknownRecord | Primitive;
type UnknownArray = Array<Ref>;
type UnknownRecord = Record<string | number | symbol, UnknownArray | Primitive>;
