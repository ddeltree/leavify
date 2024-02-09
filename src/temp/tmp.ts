/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
// import { Primitive } from '../types/Leaves.js';

type PathSuggestions<T, Prefix extends string = ''> = {
  [K in keyof T]-?: T[K] extends object
    ? `${Prefix}${K & string}.${PathSuggestions<T[K]>}`
    : `${Prefix}${K & string}`;
}[keyof T];

// // Example usage
// interface MyObject {
//   foo: {
//     bar: number;
//     baz: string;
//   };
//   hello: {
//     world: boolean;
//   };
// }

// // Get suggestions for paths in MyObject
// type Suggestions = PathSuggestions<MyObject>;

//
