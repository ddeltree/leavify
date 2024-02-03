/* eslint-disable @typescript-eslint/no-unused-vars */
import { get } from '../accessors';
import {
  CHANGES_SYMBOL,
  Changeable,
  ChangeableEntries,
} from '../changes/Changeable';
import { propose } from '../changes/changes';

function getOriginals<T extends object, K extends string>() {
  return (this as Changeable<Omit<T, K>>)[CHANGES_SYMBOL]?.original;
}
function getProposed<T extends object, K extends string>() {
  return (this as Changeable<Omit<T, K>>)[CHANGES_SYMBOL]?.proposed;
}

class Example {
  prop: string = 'vvv';
  numbers: number[];

  get original() {
    // trying to infer 'original' results in a circular reference
    return getOriginals<Example, 'original' | 'proposed'>();
  }
  get proposed() {
    return getProposed<Example, 'original' | 'proposed'>();
  }
}

const ob = new Example();
const value = get(ob, 'prop');
console.log(value);
propose(ob, [['prop', 'value']]);

console.log(ob.original?.prop);
