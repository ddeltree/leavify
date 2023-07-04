import _ from 'lodash';
/** returns the property value at path on a given object */
export const get = (obj, path) => _.property(path)(obj);
/** in-place set value of a deep nested value */
export function set(obj, path, value) {
    // split by dots or bracket pairs, except when preceded by backslash
    const points = /(?<!\\)\./;
    const brackets = /(?<!\\)\[(.*?)(?<!\\)\]/;
    // a[1][2].b ==> [['a', '1', '2'], ['b']]
    // group keys by whether they refer to directly nested array or object keys
    // --> object key   ==> single-element array, with the key
    // --> arr[][][]... ==> > 2 elements; the last one is an object key
    const groups = [];
    for (const sub of path.split(points)) {
        const match = sub.split(brackets);
        const len = match.length;
        // .any.
        if (len === 1) {
            groups.push([match[0]]);
            continue;
        }
        // .any[number].
        const [key, ...indices] = match.filter((x) => x);
        if (indices.length < 1)
            throw new Error(`The notation 'prop.[any]' is not supported
        Use 'prop[number]' or 'prop.any' instead`);
        const keys = [key];
        for (const i of indices) {
            if (isNaN(i))
                throw new Error(`The notation 'prop[string]' is not supported, only for numbers, when 'prop' is an array.
          Use 'prop.string' instead.`);
            keys.push(i);
        }
        groups.push(keys);
    }
    // [a]        => {a: {}}
    // [a, 1, 0]  => {a: [ ___, [ {} ] ]}
    let ref = obj;
    for (const group of groups) {
        const isLastGroup = group === _.last(groups);
        if (group.length === 1) {
            if (isLastGroup)
                break;
            ref[group[0]] ??= {};
            ref = ref[group[0]];
            continue;
        }
        for (const key of group) {
            const isLastKey = key === _.last(group);
            if (isLastGroup && isLastKey)
                break;
            ref[key] ??= isLastKey ? {} : [];
            ref = ref[key];
        }
    }
    ref[groups.flat().slice(-1)[0]] = value;
    return obj;
}
