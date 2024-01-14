// TODO only works for the case `const my_variable = ... as const`, but I think I could also make it work for the case my_variable is defined without `as const`
export type Leaves<T, Acc extends Leaf = undefined> = T extends readonly any[] // ARRAY
  ? EntriesOfArray<T>[RangeTo<Length<T>>] extends infer Entry
    ? Entry extends [Leaf, any]
      ? Acc extends undefined
        ? Leaves<Entry[1], `[${Entry[0]}]`>
        : Leaves<Entry[1], `${Acc}[${Entry[0]}]`>
      : never
    : never
  : T extends object | undefined // OBJECT
  ? EntriesOfObject<T>[keyof T] extends infer Entry
    ? Entry extends [Leaf, any]
      ? Acc extends undefined
        ? Leaves<Entry[1], Entry[0]>
        : Leaves<Entry[1], `${Acc}.${Entry[0]}`>
      : never
    : never
  : T extends Leaf // LEAF
  ? `${Acc} = ${Leaf<T>}`
  : never;

// HELPERS

type Leaf<T = undefined> = T extends undefined
  ? string | number | bigint | boolean | null | undefined
  : T extends Leaf
  ? T
  : never;

type Length<T extends readonly any[]> = T['length'];

type EntriesOfArray<T extends readonly any[]> = {
  [K in RangeTo<Length<T>>]: [K, T[K]];
};
type EntriesOfObject<T extends object | undefined> = {
  [K in keyof T]: [K, T[K]];
};

// RANGE GENERATOR

type RangeTo<T extends number> = T extends 0 ? 0 : GenerateRange<T, []>;

type GenerateRange<
  T extends number,
  Acc extends number[],
> = Acc['length'] extends T
  ? Acc[number]
  : GenerateRange<T, [...Acc, Acc['length']]>;
