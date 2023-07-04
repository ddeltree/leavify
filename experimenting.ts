import _ from 'lodash';
import { set, get } from './setGet.js';

/** from object to path-value pairs */
function toLeaves(obj, mapLeaf = (x, _) => x) {
  // flatten
  function flatten(ob) {
    const result = {};
    _.forEach(ob, (value, key) => {
      if (!_.isObject(value)) {
        result[key] = value; // leaf
        return;
      }
      const flat = flatten(value);
      _.forEach(flat, (subValue, subKey) => {
        const k = key + (_.isArray(value) ? `[${subKey}` : `.${subKey}`);
        result[k] = subValue;
      });
    });
    return result;
  }
  const toReturn = flatten(obj);

  // map
  _.forEach(toReturn, (value, path) => {
    const str = path.replace(/\[[0-9]*/g, '[1]');
    console.log(str);
    toReturn[str] = mapLeaf(value, path);
  });
  return toReturn;
}

/** from path-value pairs to object */
function toTree(obj, mapLeaf = (x, _) => x) {
  let toReturn = {};
  _.forEach(obj, (value, path) => {
    // setPathValue(toReturn, path, mapLeaf(value, path));
    set(toReturn, path, mapLeaf(value, path));
  });
  return toReturn;
}

const ob1 = {
  a: {
    b: ['davi', 'alexandre'],
    c: 'null',
  },
  x: {
    y: 'yplson',
  },
};

const ob2 = {
  a: {
    b: {
      0: 'davi',
      1: 'alexandre',
    },
    c: null,
  },
  x: {
    y: 'yplson',
  },
};

const ob3 = {
  a: {
    b: {
      0: 'davi',
      one: 'alexandre',
    },
    c: null,
  },
  x: {
    y: 'yplson',
  },
};

function test(tree) {
  const leaves = toLeaves(tree);
  const inversed = toTree(leaves);
  const str = (v) => JSON.stringify(v, null, 0);
  console.log(str(tree));
  console.log(JSON.stringify(leaves, null, 2));
  // console.log(str(inversed));
  console.log(str(tree) === str(inversed));
}

const ob = {
  id: '0001',
  type: 'donut',
  name: 'Cake',
  ppu: 0.55,
  batters: {
    batter: [
      [[[[[{ id: '1001', type: 'Regular' }]]]]],
      { id: '1002', type: 'Chocolate' },
      { id: '1003', type: 'Blueberry' },
      { id: '1004', type: "Devil's Food" },
    ],
  },
  topping: [
    { id: '5001', type: 'None' },
    { id: '5002', type: 'Glazed' },
    { id: '5005', type: 'Sugar' },
    { id: '5007', type: 'Powdered Sugar' },
    { id: '5006', type: 'Chocolate with Sprinkles' },
    { id: '5003', type: 'Chocolate' },
    { id: '5004', type: 'Maple' },
  ],
};

test(ob);

// console.log(_.toPath('a[0].2.f'));

// The problem with lodash's toPath is that it gives
// the same output for both 'a[0]' and 'a.0'
// and for that reason, it can't tell arrays and objects apart
// which is a problem if you want to inverse the path record and use the array's methods
// another problem arises if you mix numbers and words as keys

// a[0].b = ... ==>  {a: [   {b: ...} ]}
// a.0.b  = ... ==>  {a: {0: {b: ...} }}
