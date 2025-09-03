/**
 * Imports
 */

import { xJetError } from '@errors/xjet.error';
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

describe('xJetError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should instantiate xJetError with default name', () => {
        const error = new xJetError('Test message');

        expect(error).toBeInstanceOf(xJetError);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('xJetError');
        expect(error.message).toBe('Test message');
        expect((<any> error).formattedStack).toBe('[formatted stack for: Test message]');
        expect(formatStack).toHaveBeenCalledWith(error, { withFrameworkFrames: true });
    });

    test('should accept custom stack trace options', () => {
        const options = { withFrameworkFrames: false };
        const error = new xJetError('Custom options', options);

        expect((<any> error).formattedStack).toBe('[formatted stack for: Custom options]');
        expect(formatStack).toHaveBeenCalledWith(error, options);
    });

    test('should have proper instanceof chain', () => {
        const error = new xJetError('Check instanceof');
        expect(error instanceof Error).toBe(true);
        expect(error instanceof xJetError).toBe(true);
    });
});
