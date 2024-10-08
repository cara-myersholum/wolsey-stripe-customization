/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

export const stringToObject = (path, value, obj): void => {
    let objValue = value;
    try {
        objValue = JSON.parse(value);
    } catch {
    }

    const parts = path.split('.');
    let part;
    const last = parts.pop();
    let m;
    while (part = parts.shift()) {
        if (part.indexOf('[') !== -1) {
            const regex = new RegExp(/(\w+)\[(\d)]/, 'gm');
            while ((m = regex.exec(part)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex += 1;
                }

                const arrayName = m[1];
                const arrayIndex = +m[2];

                if (!obj[arrayName]) {
                    obj[arrayName] = [];
                }

                if (!obj[arrayName][arrayIndex]) {
                    obj[arrayName][arrayIndex] = {};
                }
                obj = obj[arrayName][arrayIndex];
            }
        } else {
            if (typeof obj[part] !== 'object' && part.indexOf('[') === -1) {
                obj[part] = {};
            }
            obj = obj[part];
        }
    }

    if (obj.hasOwnProperty(last) && obj[last] && obj[last].constructor === Array) {
        obj[last].push(objValue);
    } else if (obj.hasOwnProperty(last) && obj[last]) {
        const objArray = [];
        objArray.push(obj[last]);
        objArray.push(objValue);
        obj[last] = objArray;
    } else {
        obj[last] = objValue;
    }
};
