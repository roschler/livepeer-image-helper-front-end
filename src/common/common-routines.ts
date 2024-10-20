// Some helper routines.

/**
 * Recursively searches through an object and logs the names of all properties
 * that are declared with the BigInt interface.
 *
 * @param theObj - The object to search for BigInt properties.
 * @param parentPropertyName - The current property path used for logging, defaulting to 'root'.
 */
/* eslint-disable */
export function showAllBigintFieldNames(theObj: any, parentPropertyName: string = 'root'): void {
    if (theObj && typeof theObj === 'object') {
        for (const key in theObj) {
            if (theObj.hasOwnProperty(key)) {
                const value = theObj[key];
                const fullPropertyName = `${parentPropertyName}.${key}`;

                if (typeof value === 'bigint') {
                    console.log(fullPropertyName);
                } else if (typeof value === 'object' && value !== null) {
                    showAllBigintFieldNames(value, fullPropertyName);
                }
            }
        }
    }
}
/* eslint-enable */