/**
 * Imports
 */

import { getInvocationLocation } from './location.component';

/**
 * Tests
 */

describe('getLocation', () => {
    const OriginalError = global.Error;

    beforeAll(() => {
        // Mock the Error constructor
        global.Error = jest.fn() as unknown as typeof Error;
        (global.Error as any).mockImplementation(() => ({
            stack: ''
        }));
    });

    afterAll(() => {
        // Restore the original Error constructor
        global.Error = OriginalError;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return location object with line and column numbers when stack trace is valid', () => {
        // Mock stack trace with known format
        const mockStack = `Error
            at Object.<anonymous> (/fake/path/file.ts:10:15)
            at Module._compile (internal/modules/cjs/loader.js:999:30)
            at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
            at Module.load (internal/modules/cjs/loader.js:863:32)
            at executeUserCode (/test/path/file.ts:25:20)`;

        (global.Error as any).mockImplementation(() => ({
            stack: mockStack
        }));

        const result = getInvocationLocation(2);

        expect(result).not.toBeUndefined();
        expect(result).toEqual({
            line: 1027,
            column: 10,
            source: 'internal/modules/cjs/loader.js'
        });
    });

    test('should return null when stack trace format is invalid', () => {
        // Mock stack trace with invalid format
        const mockStack = `Error
            at Object.<anonymous> (/fake/path/file.ts)
            at Module._compile
            at Object.Module._extensions..js
            at Module.load
            at executeUserCode`;

        (global.Error as any).mockImplementation(() => ({
            stack: mockStack
        }));

        const result = getInvocationLocation();

        expect(result).toBeUndefined();
    });

    test('should return null when stack trace is empty', () => {
        Object.defineProperty(Error.prototype, 'stack', {
            configurable: true,
            get: () => ''
        });

        const result = getInvocationLocation();

        expect(result).toBeUndefined();
    });

    test('should return null when stack trace has insufficient lines', () => {
        const mockStack = `Error
            at Object.<anonymous> (/fake/path/file.ts:10:15)
            at Module._compile (internal/modules/cjs/loader.js:999:30)`;

        (global.Error as any).mockImplementation(() => ({
            stack: mockStack
        }));

        const result = getInvocationLocation();

        expect(result).toBeUndefined();
    });

    test('should handle JSCore stack trace format', () => {
        // Mock JSCore style stack trace
        const mockStack = `Error
            global code@http://localhost:8080/main.js:1:1
            eval code@http://localhost:8080/vendor.js:2:1
            forEach@http://localhost:8080/utils.js:3:1
            executeUserCode@http://localhost:8080/app.js:42:15
            runTest@http://localhost:8080/test.js:100:25`;

        (global.Error as any).mockImplementation(() => ({
            stack: mockStack
        }));

        const result = getInvocationLocation(2);

        expect(result).not.toBeUndefined();
        expect(result).toEqual({
            line: 3,
            column: 1,
            source: 'http://localhost:8080/utils.js'
        });
    });
});
