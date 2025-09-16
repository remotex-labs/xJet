/**
 * Imports
 */

import { FailingError } from '@shared/errors/failing.error';
import { ExecutionError } from '@shared/errors/execution.error';

/**
 * Tests
 */

describe('FailingError', () => {
    test('should extend ExecutionError', () => {
        const error = new FailingError();
        expect(error).toBeInstanceOf(ExecutionError);
        expect(error).toBeInstanceOf(Error);
    });

    test('should have the correct error message', () => {
        const error = new FailingError();
        expect(error.message).toBe('Failing test passed even though it was supposed to fail. Remove `.failing` to remove error.');
    });

    test('should have the correct error name', () => {
        const error = new FailingError();
        expect(error.name).toBe('xJetFailingError');
    });

    test('should capture and maintain the stack trace', () => {
        // Store the original captureStackTrace
        const originalCaptureStackTrace = Error.captureStackTrace;

        // Mock captureStackTrace to verify it's called correctly
        const mockCaptureStackTrace = jest.fn();
        Error.captureStackTrace = mockCaptureStackTrace;

        try {
            const error = new FailingError();

            expect(mockCaptureStackTrace).toHaveBeenCalledWith(error, FailingError);
        } finally {
            // Restore the original captureStackTrace
            Error.captureStackTrace = originalCaptureStackTrace;
        }
    });

    test('should handle environments where captureStackTrace is not available', () => {
        // Store the original captureStackTrace
        const originalCaptureStackTrace = Error.captureStackTrace;

        // Set captureStackTrace to undefined to simulate environments where it's not available
        Error.captureStackTrace = <any> undefined;

        try {
            // This should not throw an error
            const error = new FailingError();
            expect(error).toBeInstanceOf(FailingError);
        } finally {
            // Restore the original captureStackTrace
            Error.captureStackTrace = originalCaptureStackTrace;
        }
    });

    test('should be throwable and catchable', () => {
        expect(() => {
            throw new FailingError();
        }).toThrow(FailingError);

        try {
            throw new FailingError();
        } catch (error) {
            expect(error).toBeInstanceOf(FailingError);
            expect((error as Error).message).toContain('Remove `.failing` to remove error');
        }
    });
});
