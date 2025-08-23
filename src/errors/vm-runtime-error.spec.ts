/**
 * Imports
 */

import { xJetBaseError } from '@errors/base.error';
import { formatStack } from '@providers/stack.provider';
import { VMRuntimeError } from '@errors/vm-runtime.error';

/**
 * Mock dependencies
 */

jest.mock('@providers/stack.provider', () => ({
    formatStack: jest.fn((error) => `[formatted stack for: ${ error.message }]`)
}));

/**
 * Tests
 */

describe('VMRuntimeError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should wrap a regular Error', () => {
        const original = new Error('Regular error');
        const vmError = new VMRuntimeError(original);

        expect(vmError).toBeInstanceOf(VMRuntimeError);
        expect(vmError.message).toBe('Regular error');
        expect(vmError.stack).toBe(original.stack);
        expect((<any> vmError).formattedStack).toBe('[formatted stack for: Regular error]');
        expect(formatStack).toHaveBeenCalledWith(original, undefined);
    });

    test('should return existing xJetBaseError as-is', () => {
        const baseError = new (<any> xJetBaseError)('Already base error', 'CustomBaseError');
        const wrapped = new VMRuntimeError(baseError);

        // Should return the original instance, not a new one
        expect(wrapped).toBe(baseError);
    });

    test('should wrap AggregateError and create nested VMRuntimeErrors', () => {
        const nested1 = new Error('Nested 1');
        const nested2 = new Error('Nested 2');
        const agg = new AggregateError([ nested1, nested2 ], 'Aggregate error');

        const vmError = new VMRuntimeError(agg);

        expect(vmError).toBeInstanceOf(VMRuntimeError);
        expect(vmError.message).toBe('Aggregate error');
        expect(vmError.errors).toHaveLength(2);
        expect(vmError.errors![0]).toBeInstanceOf(VMRuntimeError);
        expect(vmError.errors![1]).toBeInstanceOf(VMRuntimeError);

        expect(vmError.errors![0].message).toBe('Nested 1');
        expect(vmError.errors![1].message).toBe('Nested 2');
    });

    test('custom inspect returns formattedStack if no nested errors', () => {
        const original = new Error('Inspect test');
        const vmError = new VMRuntimeError(original);

        const inspected = (<any> vmError)[Symbol.for('nodejs.util.inspect.custom')]();
        expect(inspected).toBe('[formatted stack for: Inspect test]');
    });

    test('custom inspect returns nested error info for AggregateError', () => {
        const nested1 = new Error('Nested A');
        const nested2 = new Error('Nested B');
        const agg = new AggregateError([ nested1, nested2 ], 'Aggregate error');

        const vmError = new VMRuntimeError(agg);

        const inspected = (<any> vmError)[Symbol.for('nodejs.util.inspect.custom')]();
        expect(inspected).toContain('VMRuntimeError Contains 2 nested errors');
        expect(inspected).toContain('[formatted stack for: Nested A]');
        expect(inspected).toContain('[formatted stack for: Nested B]');
    });
});
