import { get } from '../accessors';
import { CHANGES_SYMBOL, Changeable } from '../changes/Changeable';
import { propose } from '../changes/changes';

class Example {
  prop: string = 'vvv';
  numbers: number[];

  get original() {
    return (this as Changeable<Omit<Example, 'original' | 'proposed'>>)[
      CHANGES_SYMBOL
    ]?.original;
  }
  get proposed() {
    return (this as Changeable<Omit<Example, 'original' | 'proposed'>>)[
      CHANGES_SYMBOL
    ]?.proposed;
  }
}

const ob = new Example();
const value = get(ob, 'prop');
console.log(value);
propose(ob, [['prop', 'value']]);

console.log(ob.proposed?.prop);
