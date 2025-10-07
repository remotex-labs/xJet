/**
 * Imports
 */

import { deepSearchObject } from '@shared/components/object.component';

/**
 * Tests
 */

describe('deepSearchObject', () => {
    const testObj = {
        a: 1,
        b: {
            c: 'test',
            d: [ 1, 2, { e: 'target' }]
        },
        f: null,
        g: undefined
    };

    test('should find an element by value', () => {
        const result = deepSearchObject(testObj, 'target');
        expect(result).not.toBeNull();
        expect(result?.key).toBe('e');
        expect(result?.parent).toEqual({ e: 'target' });
    });

    test('should find an element by key', () => {
        const result = deepSearchObject(testObj, null, 'c');
        expect(result).not.toBeNull();
        expect(result?.key).toBe('c');
        expect(result?.parent).toEqual({ c: 'test', d: [ 1, 2, { e: 'target' }] });
    });

    test('should return null if element not found', () => {
        const result = deepSearchObject(testObj, 'not-in-object');
        expect(result).toBeNull();
    });

    test('should return null if key not found', () => {
        const result = deepSearchObject(testObj, {}, 'not-a-key');
        expect(result).toBeNull();
    });

    test('should handle primitive values', () => {
        const result = deepSearchObject(testObj, 1);
        expect(result).not.toBeNull();
        expect(result?.key).toBe('a');
        expect(result?.parent).toBe(testObj);
    });

    test('should handle null and undefined values', () => {
        const nullResult = deepSearchObject(testObj, null);
        expect(nullResult).not.toBeNull();
        expect(nullResult?.key).toBe('f');

        const undefinedResult = deepSearchObject(testObj, undefined);
        expect(undefinedResult).not.toBeNull();
        expect(undefinedResult?.key).toBe('g');
    });

    test('should respect the maxDepth parameter', () => {
        const deepObj = {
            level1: {
                level2: {
                    level3: {
                        level4: {
                            value: 'deep-value'
                        }
                    }
                }
            }
        };

        // With default maxDepth of 3, should not find the deep value
        const defaultResult = deepSearchObject(deepObj, 'deep-value');
        expect(defaultResult).toBeNull();

        // With increased maxDepth, should find the deep value
        const increasedDepthResult = deepSearchObject(deepObj, 'deep-value', undefined, 5);
        expect(increasedDepthResult).not.toBeNull();
        expect(increasedDepthResult?.key).toBe('value');
    });

    test('should handle circular references', () => {
        const circularObj: Record<string, unknown> = { a: 1 };
        circularObj.self = circularObj;

        const result = deepSearchObject(circularObj, 1);
        expect(result).not.toBeNull();
        expect(result?.key).toBe('a');
    });

    test('should handle arrays properly', () => {
        const arrayObj = [ 1, 2, { nested: 'array-value' }];

        const result = deepSearchObject(arrayObj as unknown as Record<string, unknown>, 'array-value');
        expect(result).not.toBeNull();
        expect(result?.key).toBe('nested');
    });

    test.failing('should handle symbol keys', () => {
        /**
         * Add support for symbols
         *
         * ```ts
         *
         * for (const prop of Reflect.ownKeys(obj)) {
         *     let value: unknown;
         *
         *     try {
         *         value = Reflect.get(obj, prop);
         *     } catch {
         *         continue;
         *     }
         *
         *     if (Object.is(value, element)) return { parent: obj, key: prop };
         *     if (value && (typeof value === 'object' || typeof value === 'function')) {
         *         const found = search(value as Record<string | symbol, unknown>, depth + 1);
         *         if (found) return found;
         *     }
         * }
         * ```
         */

        const sym = Symbol('test-symbol');
        const objWithSymbol = {
            [sym]: 'symbol-value'
        };

        const result = deepSearchObject(objWithSymbol, 'symbol-value');
        expect(result).not.toBeNull();
        expect(result?.parent).toBe(objWithSymbol);
    });
});
