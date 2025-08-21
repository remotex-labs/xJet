/**
 * Import will remove at compile time
 */

import type { PromiseRejectType, PromiseResolveType } from '@remotex-labs/xjet-expect';

/**
 * Represents a unit of work to be executed asynchronously.
 *
 * @template T - The type of value that the task resolves to
 *
 * @property task - A function returning a promise representing the asynchronous task
 * @property runnerId - Optional identifier for the runner executing this task
 * @property reject - Function to reject the task's promise ({@link PromiseRejectType})
 * @property resolve - Function to resolve the task's promise with a value of type `T` ({@link PromiseResolveType})
 *
 * @see PromiseRejectType
 * @see PromiseResolveType
 *
 * @since 1.0.0
 */

export interface TaskInterface<T = never> {
    task: () => Promise<unknown>;
    runnerId?: string;
    reject: PromiseRejectType;
    resolve: PromiseResolveType<T>;
}
