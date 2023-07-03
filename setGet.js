import _ from 'lodash';

export function get(obj, path) {
  return _.property(path)(obj);
}

/** in-place set value of a deep nested value */
function set(obj, path, value) {
  const final = [];
  const points = /(?<!\\)\./,
    brackets = /(?<!\\)\[(.*?)(?<!\\)\]/;
  for (const sub of path.split(points)) {
    const match = sub.split(brackets);
    const len = match.length;
    // .any.
    if (len === 1) {
      final.push([match[0]]);
      continue;
    }
    // .[number]. or .m[number]. or .m[number][number]. (...)
    const [key, ...indices] = match.filter((x) => x);
    if (indices.length < 1)
      throw new Error(
        `The notation 'prop.[any]' is not supported
        Use 'prop[number]' or 'prop.any' instead`,
      );
    const tmp = [key];
    for (const i of indices) {
      if (isNaN(i))
        throw new Error(
          `The notation 'prop[string]' is not supported, only for numbers, when 'prop' is an array.
          Use 'prop.string' instead.`,
        );
      tmp.push(i);
    }
    final.push(tmp);
  }
  console.log(final);

  let ref = obj;
  final.forEach((keys) => {
    const len = keys.length;
    if (len === 1) {
      // if (ref === undefined) ref = {};
      ref[keys[0]] = {};
      ref = ref[keys[0]];
    } else {
      keys.forEach((key, i) => {
        // if (ref === undefined) ref = [];
        ref[key] = i === keys.length - 1 ? {} : [];
        ref = ref[key];
      });
      // ref = ref[keys[keys.length - 1]];
    }
  });
  // ref[_.last(final.flat())] = value;
  // keys.slice(0, -1).map((k) => (ref = ref[k]));
  // ref[keys[keys.length - 1]] = value;
  return obj;
}

const path = 'a[2].b.c.f[4]';
// console.log(path.split(/[\.]/).map((x) => x.split(/(?<!\\)\[(.*?)(?<!\\)\]/)));
console.log(JSON.stringify(set({}, path, 42)));
