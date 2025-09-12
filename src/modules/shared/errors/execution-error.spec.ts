/**
 * Imports
 */

import { ExecutionError } from '@shared/errors/execution.error';

/**
 * Tests
 */

describe('ExecutionError', () => {
    describe('constructor', () => {
        test('should create an instance with the provided message', () => {
            const message = 'Test error message';
            const error = new ExecutionError(message);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ExecutionError);
            expect(error.message).toBe(message);
            expect(error.name).toBe('xJetExecutionError'); // Default error name
        });

        test('should capture a stack trace', () => {
            const error = new ExecutionError('Test error');
            expect(error.stack).toBeDefined();
        });
    });

    describe('toJSON', () => {
        test('should convert the error to a plain object with standard properties', () => {
            const message = 'Test error message';
            const error = new ExecutionError(message);
            const jsonObject = error.toJSON();

            expect(jsonObject).toHaveProperty('message', message);
            expect(jsonObject).toHaveProperty('name');
            expect(jsonObject).toHaveProperty('stack');
        });

        test('should include custom properties in the JSON representation', () => {
            const error = new ExecutionError('Test error');
            (error as any).code = 'ERR_CUSTOM';
            (error as any).statusCode = 400;

            const jsonObject = error.toJSON();

            expect(jsonObject).toHaveProperty('code', 'ERR_CUSTOM');
            expect(jsonObject).toHaveProperty('statusCode', 400);
        });

        test('should work correctly with JSON.stringify', () => {
            const error = new ExecutionError('Test error');
            (error as any).extraData = { foo: 'bar' };

            const serialized = JSON.parse(JSON.stringify(error));

            expect(serialized).toHaveProperty('message', 'Test error');
            expect(serialized).toHaveProperty('extraData', { foo: 'bar' });
        });
    });

    describe('inheritance', () => {
        class CustomTestError extends ExecutionError {
            constructor(message: string, public readonly code: string) {
                super(message);
                this.name = 'CustomTestError';
            }
        }

        test('should work with extended classes', () => {
            const error = new CustomTestError('Custom error message', 'ERR_CUSTOM');

            expect(error).toBeInstanceOf(ExecutionError);
            expect(error).toBeInstanceOf(CustomTestError);
            expect(error.message).toBe('Custom error message');
            expect(error.name).toBe('CustomTestError');
            expect(error.code).toBe('ERR_CUSTOM');
        });

        test('should serialize extended classes correctly', () => {
            const error = new CustomTestError('Custom error message', 'ERR_CUSTOM');
            const jsonObject = error.toJSON();

            expect(jsonObject).toHaveProperty('message', 'Custom error message');
            expect(jsonObject).toHaveProperty('name', 'CustomTestError');
            expect(jsonObject).toHaveProperty('code', 'ERR_CUSTOM');
        });
    });
});
