/**
 * Import will remove at compile time
 */

import type { PromiseRejectType, PromiseResolveType } from '@remotex-labs/xjet-expect';

/**
 * Represents a unit of work to be executed asynchronously.
 *
 * @template T - The type of value that the task resolves to.
 *
 * @see PromiseRejectType
 * @see PromiseResolveType
 *
 * @since 1.0.0
 */

export interface TaskInterface<T = never> {
    /**
     * A function returning a promise that performs the asynchronous work
     * @since 1.0.0
     */

    task: () => Promise<unknown>;

    /**
     * Optional identifier of the runner executing this task
     * @since 1.0.0
     */

    runnerId?: string;

    /**
     * Function used to reject the task's promise.
     *
     * @see PromiseRejectType
     * @since 1.0.0
     */

    reject: PromiseRejectType;

    /**
     * Function used to resolve the task's promise with a value of type `T`.
     *
     * @see PromiseResolveType
     * @since 1.0.0
     */

    resolve: PromiseResolveType<T>;
}
