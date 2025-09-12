/**
 * Imports
 */

import { printf, prettyFormat, getValueByPath, resolveVariable, interpolateVariables } from './printf.component';

/**
 * Tests
 */

describe('String formatting utilities', () => {
    describe('prettyFormat', () => {
        test('should return string value as is', () => {
            expect(prettyFormat('test string')).toBe('test string');
        });

        test('should format objects with proper indentation', () => {
            const obj = { name: 'test', value: 123 };
            const expected = '{\n    "name": "test",\n    "value": 123\n}';
            expect(prettyFormat(obj)).toBe(expected);
        });
    });

    describe('getValueByPath', () => {
        const testData = {
            user: {
                name: 'John',
                address: {
                    city: 'New York'
                }
            },
            items: [ 1, 2, 3 ]
        };

        test('should retrieve nested object values', () => {
            expect(getValueByPath(testData, [ 'user', 'name' ])).toBe('John');
            expect(getValueByPath(testData, [ 'user', 'address', 'city' ])).toBe('New York');
        });

        test('should return undefined for non-existent paths', () => {
            expect(getValueByPath(testData, [ 'user', 'nonexistent' ])).toBeUndefined();
            expect(getValueByPath(testData, [ 'invalid', 'path' ])).toBeUndefined();
        });

        test('should handle null/undefined values in path', () => {
            const dataWithNull = { nested: { value: null } };
            expect(getValueByPath(dataWithNull, [ 'nested', 'value', 'property' ])).toBeUndefined();
        });
    });

    describe('resolveVariable', () => {
        const testData = {
            user: {
                name: 'John',
                age: 30
            }
        };

        test('should resolve array index for $#', () => {
            expect(resolveVariable('$#', testData, 5)).toBe('5');
        });

        test('should resolve nested object properties', () => {
            expect(resolveVariable('$user.name', testData, 0)).toBe('John');
            expect(resolveVariable('$user.age', testData, 0)).toBe('30');
        });

        test('should return original token for unresolvable variables', () => {
            expect(resolveVariable('$nonexistent', testData, 0)).toBe('$nonexistent');
            expect(resolveVariable('$user.invalid', testData, 0)).toBe('$user.invalid');
        });
    });

    describe('interpolateVariables', () => {
        const testData = {
            name: 'John',
            age: 30,
            nested: {
                value: 'test'
            }
        };

        test('should interpolate simple variables', () => {
            expect(interpolateVariables('Hello $name!', testData, 0))
                .toBe('Hello John!');
        });

        test('should interpolate array indices', () => {
            expect(interpolateVariables('Test case #$#', testData, 2))
                .toBe('Test case #2');
        });

        test('should interpolate nested values', () => {
            expect(interpolateVariables('Value: $nested.value', testData, 0))
                .toBe('Value: test');
        });

        test('should handle multiple variables in one string', () => {
            expect(interpolateVariables('$name is $age years old', testData, 0))
                .toBe('John is 30 years old');
        });
    });

    describe('printf', () => {
        test('should handle basic string substitution', () => {
            expect(printf('Hello %s!', [ 'World' ], 0)).toBe('Hello World!');
        });

        test('should handle multiple format specifiers', () => {
            expect(printf('Number: %d, String: %s', [ 42, 'test' ], 0))
                .toBe('Number: 42, String: test');
        });

        test('should handle index substitution', () => {
            expect(printf('Test case #%#', [], 5)).toBe('Test case #5');
        });

        test('should handle pretty printing with %p', () => {
            const obj = { test: 'value' };
            const expected = '{\n    "test": "value"\n}';
            expect(printf('Object: %p', [ obj ], 0)).toBe(`Object: ${ expected }`);
        });

        test('should handle variable interpolation', () => {
            const data = { name: 'John' };
            expect(printf('Hello $name', [ data ], 0)).toBe('Hello John');
        });

        test('should escape percent signs', () => {
            expect(printf('100%%', [], 0)).toBe('100%');
        });

        test('should handle all format specifiers', () => {
            const testObj = { key: 'value' };
            const params = [
                42.6,    // for %d
                42.6,    // for %f
                42.6,    // for %i
                testObj, // for %j
                testObj  // for %o
            ];

            expect(printf('%d %f %i %j %o', params, 0))
                .toBe('42.6 42.6 42 {"key":"value"} [object Object]');
        });
    });
});
