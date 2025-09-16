/**
 * Imports
 */

import { QueueService } from '@services/queue.service';

/**
 * Tests
 */

describe('AsyncQueueService', () => {
    let queue: QueueService;

    beforeEach(() => {
        queue = new QueueService(2); // Create a new queue with concurrency of 2 for each test
    });

    test('should initialize with correct defaults', () => {
        expect(queue.size).toBe(0);
        expect(queue.running).toBe(0);
        expect(queue.isPaused).toBe(true);
    });

    test('should respect the concurrency limit', async () => {
        // Start the queue
        queue.start();

        // Track execution state
        const startedTasks: number[] = [];
        const completedTasks: number[] = [];

        // Create promises that we can resolve manually for precise control
        const taskPromises: Record<number, { resolve: (value: any) => void }> = {};

        // Create a task that we can control when it completes
        const createControlledTask = (id: number) => async () => {
            startedTasks.push(id);

            // Create a promise that we can resolve externally
            await new Promise<void>(resolve => {
                taskPromises[id] = { resolve: () => resolve() };
            });

            completedTasks.push(id);

            return id;
        };

        // Enqueue tasks
        const taskPromise1 = queue.enqueue(createControlledTask(1));
        const taskPromise2 = queue.enqueue(createControlledTask(2));
        const taskPromise3 = queue.enqueue(createControlledTask(3));
        const taskPromise4 = queue.enqueue(createControlledTask(4));

        // Allow event loop to process initial queue operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // First check: exactly 2 tasks should be running due to concurrency limit
        expect(startedTasks.length).toBe(2);
        expect(startedTasks).toEqual([ 1, 2 ]);
        expect(completedTasks.length).toBe(0);

        // Queue stats should reflect 2 tasks running and 2 waiting
        expect(queue.running).toBe(2);
        expect(queue.size).toBe(2);

        // Resolve task 2 first
        taskPromises[2].resolve(2);

        // Allow event loop to process this completion
        await new Promise(resolve => setTimeout(resolve, 0));

        // After task 2 completes, task 3 should start
        expect(startedTasks).toEqual([ 1, 2, 3 ]);
        expect(completedTasks).toEqual([ 2 ]);
        expect(queue.running).toBe(2);
        expect(queue.size).toBe(1);

        // Complete task 1
        taskPromises[1].resolve(1);

        // Allow event loop to process this completion
        await new Promise(resolve => setTimeout(resolve, 0));

        // After task 1 completes, task 4 should start
        expect(startedTasks).toEqual([ 1, 2, 3, 4 ]);
        expect(completedTasks).toEqual([ 2, 1 ]);
        expect(queue.running).toBe(2);
        expect(queue.size).toBe(0);

        // Complete remaining tasks
        taskPromises[3].resolve(3);
        taskPromises[4].resolve(4);

        // Wait for all tasks to resolve
        const results = await Promise.all([ taskPromise1, taskPromise2, taskPromise3, taskPromise4 ]);

        // Verify final state
        expect(results).toEqual([ 1, 2, 3, 4 ]);
        expect(completedTasks).toEqual([ 2, 1, 3, 4 ]);
        expect(queue.running).toBe(0);
        expect(queue.size).toBe(0);
    });

    test('should stop and start queue processing', async () => {
        // Create a set of delayed tasks
        const results: number[] = [];
        const createTask = (id: number) => async () => {
            results.push(id);

            return id;
        };

        // Start with queue paused (default)
        expect(queue.isPaused).toBe(true);

        // Enqueue tasks while paused
        queue.enqueue(createTask(1));
        queue.enqueue(createTask(2));

        // Tasks should be in queue but not running
        expect(queue.size).toBe(2);
        expect(queue.running).toBe(0);

        // No results yet
        expect(results).toEqual([]);

        // Start the queue
        queue.start();

        // Wait for tasks to process
        await new Promise(resolve => setTimeout(resolve, 10));

        // Results should now contain completed tasks
        expect(results).toEqual([ 1, 2 ]);

        // Queue should be empty
        expect(queue.size).toBe(0);
        expect(queue.running).toBe(0);

        // Pause the queue
        queue.stop();

        // Add more tasks
        queue.enqueue(createTask(3));
        queue.enqueue(createTask(4));

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 10));

        // Tasks should still be in queue since it's paused
        expect(queue.size).toBe(2);
        expect(results).toEqual([ 1, 2 ]); // No new results

        // Start again
        queue.start();

        // Wait for tasks to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        // All tasks should be processed now
        expect(results).toEqual([ 1, 2, 3, 4 ]);
        expect(queue.size).toBe(0);
    });

    test('should clear the queue', async () => {
        // Create tasks that we'll clear
        const resolved: number[] = [];
        const rejections: Error[] = [];

        const createTask = (id: number) => async () => {
            resolved.push(id);

            return id;
        };

        // Add tasks to queue (paused)
        queue.enqueue(createTask(1)).catch(err => rejections.push(err));
        queue.enqueue(createTask(2)).catch(err => rejections.push(err));
        queue.enqueue(createTask(3)).catch(err => rejections.push(err));

        // Verify tasks are queued
        expect(queue.size).toBe(3);

        // Clear the queue
        const removed = queue.clear();

        // Check return value reports correct number removed
        expect(removed).toBe(3);

        // Queue should be empty
        expect(queue.size).toBe(0);

        // Start the queue
        queue.start();

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 10));

        // No tasks should have executed
        expect(resolved).toEqual([]);

        // None of the promises should have resolved or rejected yet
        // They should be orphaned now that the queue has been cleared
    });

    test('should handle errors in tasks', async () => {
        queue.start();

        // Create a task that will fail
        const errorTask = async () => {
            throw new Error('Task failed');
        };

        // Enqueue the failing task and a successful task
        const failingPromise = queue.enqueue(errorTask);
        const successPromise = queue.enqueue(async () => 'success');

        // The error task should reject
        await expect(failingPromise).rejects.toThrow('Task failed');

        // The success task should still complete
        await expect(successPromise).resolves.toBe('success');

        // Queue should continue processing after errors
        expect(queue.size).toBe(0);
        expect(queue.running).toBe(0);
    });

    test('should handle multiple start calls gracefully', () => {
        expect(queue.isPaused).toBe(true);

        // First start should unpause
        queue.start();
        expect(queue.isPaused).toBe(false);

        // Second start should have no effect
        queue.start();
        expect(queue.isPaused).toBe(false);
    });

    test('should use minimum concurrency of 1', () => {
        // Test with invalid concurrency values
        const queueZero = new QueueService(0);
        const queueNegative = new QueueService(-5);

        // Both should default to concurrency of 1
        expect(queueZero.isPaused).toBe(true);
        expect(queueNegative.isPaused).toBe(true);

        // We can't directly test the concurrency value as it's private,
        // but we can test the behavior
        queueZero.start();
        queueNegative.start();

        const results: number[] = [];

        queueZero.enqueue(async () => {
            results.push(1);
            // Delaying to ensure second task isn't executed immediately
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        queueZero.enqueue(async () => {
            results.push(2);
        });

        // At this point, only one task should be running
        expect(queueZero.running).toBe(1);

        // Let tasks complete
        return new Promise<void>(resolve => {
            setTimeout(() => {
                expect(results).toEqual([ 1, 2 ]);
                resolve();
            }, 30);
        });
    });
});
