/**
 * Import will remove at compile time
 */

import type { FunctionLikeType } from '@remotex-labs/xjet-expect';

/**
 * Imports
 */

import { TimeoutError } from '@errors/timeout.error';
import { inject } from '@symlinks/services/inject.service';
import { TimerService } from '@shared/services/timer.service';


/**
 * Executes a given asynchronous or synchronous task with an optional timeout constraint.
 *
 * @typeParam T - The resolved value type.
 *
 * @param task - Either a function that returns a value or promise, or a promise itself.
 * @param delay - Timeout in milliseconds, or `-1` to disable the timeout.
 * @param at - A contextual label (e.g., method name or operation name) to aid debugging.
 * @param stack - Optional stack trace to provide more detailed error context.
 *
 * @throws {@link TimeoutError} If the task does not complete within the specified `delay`
 * (only when `delay` is not `-1`).
 *
 * @remarks
 * The function accepts either:
 * - a function returning a value or a promise, or
 * - a promise directly.
 *
 * If `delay` is `-1`, no timeout is applied. Otherwise the task is raced against
 * a timer and a {@link TimeoutError} is thrown on expiry.
 *
 * @example
 * ```ts
 * // Passing a function
 * await withTimeout(
 *   () => fetchData(),
 *   5000,
 *   'fetchData'
 * );
 *
 * // Passing a promise directly
 * await withTimeout(
 *   fetchData(),
 *   5000,
 *   'fetchDataDirect'
 * );
 *
 * // No timeout
 * await withTimeout(fetchData(), -1, 'fetchDataNoTimeout');
 * ```
 *
 * @since 1.1.0
 */

export async function withTimeout<T>(
    task: FunctionLikeType<T | Promise<T>> | Promise<T> | T, delay: number, at: string, stack?: string
): Promise<T> {
    const timers = inject(TimerService);

    const taskPromise =
        typeof task === 'function'
            ? Promise.resolve((task as FunctionLikeType<T | Promise<T>>)())
            : Promise.resolve(task);

    if (delay === -1 || !timers.originalSetTimeout) {
        return taskPromise;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = timers.originalSetTimeout?.(
            () => reject(new TimeoutError(delay, at, stack)),
            delay
        );
    });

    try {
        return await Promise.race([ taskPromise, timeoutPromise ]);
    } finally {
        timers.originalClearTimeout?.(timeoutId!);
    }
}

