/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeableEntries, OriginalEntries } from "../changes/Changeable.js";
import type Fragment from "./Fragment.js";
import { type NoFragment } from "./Fragment.js";
import { Primitive } from "./Leaves.js";

/** [`key`, `value | ref`, `isLeaf | circular_ref`] */
type Ref = [string | number, object | Primitive, boolean | "..."];

export type Refs<T extends object, ACC extends Ref[] = []> =
  T extends infer U ?
    {
      [K in keyof U]-?: U[K] extends infer V ?
        [K, U, false] extends infer REF extends Ref ?
          V extends (
            Primitive // leaf value
          ) ?
            [...ACC, [REF[0], REF[1], true]]
          : REF extends (
            ACC[number] // circular reference
          ) ?
            [...ACC, [REF[0], REF[1], "..."]]
          : V extends object ? Refs<V, [...ACC, REF]>
          : never
        : never
      : never;
    }[Exclude<
      U extends readonly unknown[] ? Exclude<keyof U, keyof []> : keyof U,
      ChangeableKeys<U>
    >]
  : never;

type ToString<REFS extends Ref[], PREVIOUS extends Ref | null = null> =
  REFS extends [infer FIRST extends Ref, ...infer REST extends Ref[]] ?
    `${FIRST[1] extends unknown[] ? `[${FIRST[0]}]`
    : `${PREVIOUS extends null ? "" : "."}${FIRST[0]}`}${ToString<REST, FIRST>}`
  : PREVIOUS extends Ref ?
    PREVIOUS[2] extends "..." ?
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `${any}`
    : ""
  : PREVIOUS extends (
    null // TODO vazio
  ) ?
    never // TODO
  : never;

type LeafPath<T extends object> = ToString<Refs<NoFragment<T>>>;
export default LeafPath;

type ChangeableKeys<T> = {
  [K in keyof T]: T[K] extends ChangeableEntries ? K : never;
}[keyof T];
