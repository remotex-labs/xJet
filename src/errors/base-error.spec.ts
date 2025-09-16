/**
 * Imports
 */

import { xJetBaseError } from '@errors/base.error';
import { formatStack } from '@providers/stack.provider';

/**
 * Mock dependencies
 */

jest.mock('@providers/stack.provider', () => ({
    formatStack: jest.fn((error) => `[formatted stack for: ${ error.message }]`)
}));

/**
 * Tests
 */

describe('xJetBaseError', () => {
    class TestError extends xJetBaseError {
        constructor(message: string, name?: string) {
            super(message, name);
        }
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should set custom error name', () => {
        const error = new TestError('Something broke', 'CustomName');
        expect(error.name).toBe('CustomName');
    });

    test('should use default error name if not provided', () => {
        const error = new TestError('Default name');
        expect(error.name).toBe('xJetError');
    });

    test('should maintain correct instanceof chain', () => {
        const error = new TestError('Check instanceof');
        expect(error instanceof TestError).toBe(true);
        expect(error instanceof xJetBaseError).toBe(true);
        expect(error instanceof Error).toBe(true);
    });

    test('toJSON should include own properties, name, message, and stack', () => {
        const error = new TestError('JSON test') as any;
        (error as any).extra = 42;

        const json = error.toJSON();
        expect(json.name).toBe('xJetError');
        expect(json.message).toBe('JSON test');
        expect(json.stack).toBeDefined();
        expect(json.extra).toBe(42);
    });

    test('custom inspect should return formatted stack if available', () => {
        const error = new TestError('Inspect test');
        error['formattedStack'] = '[formatted stack]';
        const customInspect = Symbol.for('nodejs.util.inspect.custom');
        const inspected = (error as any)[customInspect]();
        expect(inspected).toBe('[formatted stack]');
    });

    test('custom inspect should return stack if formatted stack not set', () => {
        const error = new TestError('Inspect fallback');
        const customInspect = Symbol.for('nodejs.util.inspect.custom');
        const inspected = (error as any)[customInspect]();
        expect(inspected).toBe(error.stack);
    });

    test('reformatStack should call formatStack and set formattedStack', () => {
        const error = new TestError('Reformat stack');
        error['reformatStack'](error, {});
        expect(formatStack).toHaveBeenCalledWith(error, {});
        expect(error['formattedStack']).toBe('[formatted stack for: Reformat stack]');
    });
});
