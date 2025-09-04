/**
 * Imports
 */

import { withTimeout } from '@components/timeout.component';

/**
 * Mock dependencies
 */

jest.useFakeTimers();

/**
 * Tests
 */

describe('withTimeout', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    test('should complete successfully when task finishes before timeout', async () => {
        // Arrange
        const task = jest.fn().mockResolvedValue('success');
        const delay = 1000;
        const at = 'test-location';

        // Act
        const promise = withTimeout(task, delay, at);

        // Resolve any pending promises
        await jest.runOnlyPendingTimersAsync();

        // Wait for promise to resolve
        await expect(promise).resolves.not.toThrow();

        // Assert that task was called - this should be after the promise resolution
        expect(task).toHaveBeenCalled();
    });

    test('should throw TimeoutError when task exceeds timeout period', async () => {
        // Arrange
        const task = jest.fn(() => new Promise(resolve => {
            setTimeout(() => resolve('too late'), 2000);
        }));
        const delay = 1000;
        const at = 'test-timeout-location';

        // Act
        const promise = withTimeout(task, delay, at);

        // Fast-forward timer by delay amount
        jest.advanceTimersByTime(delay);

        await expect(promise).rejects.toThrow();
    });

    test('should pass location information to the TimeoutError', async () => {
        // Arrange
        const task = jest.fn(() => new Promise(resolve => {
            setTimeout(() => resolve('too late'), 2000);
        }));
        const delay = 1000;
        const at = 'test-location-info';

        // Act
        const promise = withTimeout(task, delay, at);

        // Fast-forward timer by delay amount
        jest.advanceTimersByTime(delay);

        // Assert that location info is passed to error
        await expect(promise).rejects.toThrow('Exceeded timeout of 1000 ms at test-location-info');
    });

    test('should properly handle synchronous tasks', async () => {
        // Arrange
        const task = jest.fn(() => 'sync result');
        const delay = 1000;
        const at = 'test-sync';

        // Act
        const promise = withTimeout(task, delay, at);

        // Assert
        await expect(promise).resolves.not.toThrow();
        expect(task).toHaveBeenCalled();
    });

    test('should clear timeout when task completes successfully', async () => {
        // Arrange
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        const task = jest.fn().mockResolvedValue('success');
        const delay = 1000;
        const at = 'test-clear-timeout';

        // Act
        await withTimeout(task, delay, at);

        // Assert
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    test('should clear timeout even when task throws an error', async () => {
        // Arrange
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        const taskError = new Error('Task failed');
        const task = jest.fn().mockRejectedValue(taskError);
        const delay = 1000;
        const at = 'test-task-error';

        // Act & Assert
        await expect(withTimeout(task, delay, at)).rejects.toThrow(taskError);
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });
});
