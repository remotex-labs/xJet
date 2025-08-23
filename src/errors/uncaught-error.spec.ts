/**
 * Imports
 */

import '@errors/uncaught.error';

/**
 * Mock dependencies
 */

jest.mock('@providers/stack.provider', () => ({
    formatStack: jest.fn((error: Error) => error)
}));

/**
 * Tests
 */

describe('Global error handlers', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;
    let uncaughtExceptionHandler: (error: Error) => void;
    let unhandledRejectionHandler: (reason: Error) => void;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

        const listeners = process.listeners('uncaughtException');
        uncaughtExceptionHandler = listeners[listeners.length - 1] as (error: Error) => void;

        const rejectionListeners = process.listeners('unhandledRejection');
        unhandledRejectionHandler = rejectionListeners[rejectionListeners.length - 1] as (reason: Error) => void;
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    describe('uncaughtException handler', () => {
        test('should log the error and exit with code 1', () => {
            const testError = new Error('Test uncaught exception');
            uncaughtExceptionHandler(testError);
            expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });

    describe('unhandledRejection handler', () => {
        test('should log the rejection reason and exit with code 2', () => {
            const testReason = new Error('Test unhandled rejection');
            unhandledRejectionHandler(testReason);
            expect(consoleErrorSpy).toHaveBeenCalledWith(testReason);
            expect(processExitSpy).toHaveBeenCalledWith(2);
        });
    });

    describe('integration tests', () => {
        test('should handle different error types appropriately', () => {
            const stringError = 'string error';
            const objectError = { message: 'object error' };

            uncaughtExceptionHandler(stringError as any);
            expect(consoleErrorSpy).toHaveBeenCalledWith(stringError);
            expect(processExitSpy).toHaveBeenCalledWith(1);

            unhandledRejectionHandler(objectError as any);
            expect(consoleErrorSpy).toHaveBeenCalledWith(objectError);
            expect(processExitSpy).toHaveBeenCalledWith(2);
        });
    });
});
