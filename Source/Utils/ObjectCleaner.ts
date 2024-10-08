/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * deepCleaner
 *
 * @param {Object} obj :: the object being cleaned
 * @param {?String|?Array} target :: A string or array of strings of key(s) for key-value pair(s) to be cleaned from `obj`
 */
export const objectCleaner = (obj, target = null): unknown => {

    if (isArray(target)) {
        removeKeyLoop(obj, target);
    } else {
        cleanCyclicObject(obj, target);
    }
    return obj;
};

/**
 * cleanCyclicObject :: Removes any undefined, null, or empty strings, arrays, or objects from `obj`.
 *    Uses a `WeakMap` to keep track of objects that have been visited while recursively cleaning
 *    an object to prevent infinite recursive calls.
 * @param {Object} object :: the object to be cleaned
 * @param {?String} target :: Optional key to remove from `object`. If not specified, the default
 *    behavior is to remove "empty" values from `object`. A value is considered to be empty if it
 *    is one of the following:
 *      - empty strings
 *      - empty arrays
 *      - empty objects
 *      - values that are null
 *      - values that are undefined
 */
const cleanCyclicObject = (object, target = null) => {

    const visitedObjects = new WeakMap(); // use a WeakMap to keep track of which objects have been visited

    const recursiveClean = obj => {

        // If `obj` is an actual object, check if it's been seen already.
        if (isObject(obj)) {

            // If we've seen this object already, return to stop infinite loops
            if (visitedObjects.has(obj)) {
                return;
            }

            // If we haven't seen this object yet, add it to the list of visited objects.
            // Since 'obj' itself is used as the key, the value of 'objects[obj]' is
            // irrelevent. I just went with using 'null'.
            visitedObjects.set(obj, null);

            for (const key in obj) {
                if (
                    (target && key === target)              // Check if 'key' is the target to delete,
                    || (!target && isEmpty(obj[key])) // or if 'target' is unspecified but the object is "empty"
                ) {
                    delete obj[key];
                } else {
                    recursiveClean(obj[key]);
                }
            }

            // If 'obj' is an array, check it's elements for objects to clean up.
        } else if (isArray(obj)) {
            for (const i in obj) {
                recursiveClean(obj[i]);
            }
        }
    };

    recursiveClean(object);
};

/**
 * removeKeyLoop :: does the same thing as `removeKey()` but with multiple keys.
 * @param {Object} obj :: the object being cleaned
 * @param {String|Array} keys :: an array containing keys to be cleaned from `obj`
 */
const removeKeyLoop = (obj, keys) => {
    for (const key of keys) {
        cleanCyclicObject(obj, key);
    }
};

/**
 * repr :: gets the string representation of `arg`
 * @param {} arg :: unknown function argument
 * @returns {String} :: a string representation of `arg`
 */
const repr = arg => {
    return Object.prototype.toString.call(arg);
};

/**
 * isArray
 * @param {} arg :: unknown function argument
 * @returns {Boolean} :: returns true if `arg` is an Array, false otherwise
 */
const isArray = arg => {
    return Array.isArray ? Array.isArray(arg) : repr(arg) === '[object Array]';
};

/**
 * isObject :: checks if `arg` is an object.
 * @param {} arg :: unknown function argument
 * @returns {Boolean} :: returns true if `arg` is an object.
 */
const isObject = arg => {
    return repr(arg) === '[object Object]';
};

/**
 * isNull :: checks if `arg` is null.
 * @param {} arg :: unknown function argument
 * @returns {Boolean} :: returns true if `arg` is of type Null, false otherwise
 */
const isNull = arg => {
    return repr(arg) === '[object Null]';
};

/**
 * isUndefined :: checks if `arg` is undefined.
 * @param {} arg :: unknown function argument
 * @returns {Boolean} :: Returns true if `arg` is of type Undefined, false otherwise
 */
const isUndefined = arg => {
    try {
        return typeof (arg) === 'undefined';
    } catch (e) {
        if (e instanceof ReferenceError) {
            return true;
        }
        throw e;
    }
};

/**
 * isString :: checks if `arg` is a string.
 * @param {} arg :: unknown function argument
 * @returns {Boolean} :: returns true if `arg` is a String, false otherwise
 */
const isString = arg => {
    return repr(arg) === '[object String]';
};

/**
 * isTruthyish :: checks if `arg` is not null or undefined.
 *
 * for example, statements like `!""`, `!0`, `!null`, or `!undefined`
 *  evaluate to `true`. However, sometimes deep-cleaner is only interested
 *  if something is null or undefined, so `isTruthyish("")` and
 *  `isTruthyish(0)` evaluate to `true`, while `isTruthyish(null)` and
 *  `isTruthyish(undefined)` still evaluate to `false`.
 *
 * @param {} arg :: unknown function argument.
 * @returns {Boolean}
 */
const isTruthyish = arg => {
    if (arg === false) {
        return false;
    }
    return !(isNull(arg) || isUndefined(arg));
};

/**
 * isEmpty :: Checks if `arg` is an empty string, array, or object.
 *
 * @param {} arg :: unknown function argument
 * @returns {Boolean} :: Returns true if `arg` is an empty string,
 *  array, or object. Also returns true is `arg` is null or
 *  undefined. Returns true otherwise.
 */
const isEmpty = arg => {
    return (
        isUndefined(arg)
        || isNull(arg)
        || (isString(arg) && arg.length === 0)
        || (isArray(arg) && arg.length === 0)
        || (isObject(arg) && Object.keys(arg).length === 0)
    );
};
