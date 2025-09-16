/**
 * Import will remove at compile time
 */

import type { TaskInterface } from '@services/interfaces/queue-service.interface';

/**
 * Imports
 */

import { Injectable } from '@symlinks/services/inject.service';

/**
 * A service that manages asynchronous tasks with configurable concurrency.
 *
 * @remarks
 * This queue allows tasks to be enqueued and executed with a limit on the number of
 * concurrently running tasks. Tasks can be paused, resumed, cleared, or removed by runner ID.
 *
 * @example
 * ```ts
 * const queue = new QueueService(2);
 * queue.start();
 * queue.enqueue(async () => {
 *   console.log("Task executed");
 * });
 * ```
 *
 * @since 1.0.0
 */

@Injectable({
    scope: 'singleton'
})
export class QueueService {
    /**
     * Controls whether the queue processing is active or paused
     * @since 1.0.0
     */

    private paused = true;

    /**
     * Tracks the number of tasks currently being executed
     * @since 1.0.0
     */

    private activeCount = 0;

    /**
     * Maximum number of tasks that can execute concurrently
     * @since 1.0.0
     */

    private readonly concurrencyLimit: number;

    /**
     * Contains the pending tasks waiting to be processed
     * @since 1.0.0
     */

    private queue: Array<TaskInterface> = [];

    /**
     * Creates a new QueueService instance.
     *
     * @param concurrencyLimit - Maximum number of concurrent tasks (defaults to 1 if non-positive)
     * @default concurrencyLimit - 1
     *
     * @since 1.0.0
     */

    constructor(concurrencyLimit?: number) {
        this.concurrencyLimit =  concurrencyLimit && concurrencyLimit > 0 ? concurrencyLimit : 1;
    }

    /**
     * Returns the number of tasks currently in the queue.
     *
     * @returns The number of pending tasks
     * @since 1.0.0
     */

    get size(): number {
        return this.queue.length;
    }

    /**
     * Returns the number of tasks currently running.
     *
     * @returns The number of active tasks
     * @since 1.0.0
     */

    get running(): number {
        return this.activeCount;
    }

    /**
     * Returns whether the queue is currently paused.
     *
     * @returns `true` if the queue is paused, otherwise `false`
     * @since 1.0.0
     */

    get isPaused(): boolean {
        return this.paused;
    }

    /**
     * Pauses the processing of the queue.
     *
     * @since 1.0.0
     */

    stop(): void {
        this.paused = true;
    }

    /**
     * Resumes processing of the queue if it was paused.
     *
     * @since 1.0.0
     */

    start(): void {
        if (this.paused) {
            this.paused = false;
            // Start processing queue tasks again
            this.processQueue();
        }
    }

    /**
     * Clears all pending tasks from the queue and rejects their promises.
     *
     * @returns The number of tasks that were removed
     * @since 1.0.0
     */

    clear(): number {
        const count = this.queue.length;

        this.queue.forEach(taskItem => {
            if ('reject' in taskItem) {
                taskItem.reject();
            }
        });

        this.queue = [];

        return count;
    }

    /**
     * Adds a task to the queue and returns a promise for its result.
     *
     * @template T - The type of value that the task resolves to
     * @param task - A function returning a promise representing the asynchronous task
     * @param runnerId - Optional identifier for the runner executing this task
     *
     * @returns A promise that resolves or rejects with the task's result
     *
     * @see {@link TaskInterface}
     * @since 1.0.0
     */

    enqueue<T>(task: () => Promise<T>, runnerId?: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // Wrap the task to handle its completion
            const wrappedTask = async (): Promise<void> => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.activeCount--;
                    this.processQueue();
                }
            };

            this.queue.push({ task: wrappedTask, runnerId, reject, resolve });
            if (!this.paused) {
                this.processQueue();
            }
        });
    }

    /**
     * Removes all tasks associated with a specific runner ID.
     *
     * @param runnerId - The ID of the runner whose tasks should be removed
     *
     * @returns The number of tasks removed
     * @since 1.0.0
     */

    removeTasksByRunner(runnerId: string): number {
        const initialCount = this.queue.length;
        this.queue = this.queue.filter(item => item.runnerId !== runnerId);

        return initialCount - this.queue.length;
    }

    /**
     * Processes tasks in the queue according to the concurrency limit.
     *
     * @since 1.0.0
     */

    private processQueue(): void {
        if (this.paused) {
            return;
        }

        while (this.activeCount < this.concurrencyLimit && this.queue.length > 0) {
            const item = this.queue.shift();
            if (item) {
                this.activeCount++;
                item.task();
            }
        }
    }
}
