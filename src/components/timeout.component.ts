/**
 * Import will remove at compile time
 */

import type { FunctionLikeType } from '@remotex-labs/xjet-expect';

/**
 * Executes a given task with a timeout constraint.
 *
 * @template T - The return type of the task function (can be sync or async).
 *
 * @param task - The task function to execute.
 * @param delay - The maximum allowed duration in milliseconds.
 * @param at - A string describing the context where the timeout occurred.
 * @returns A promise that resolves when the task completes or rejects if it exceeds the timeout.
 *
 * @throws Error - If the task execution exceeds the given timeout duration.
 *
 * @remarks
 * This utility wraps a synchronous or asynchronous function in a timeout mechanism.
 * If the function does not resolve within the specified duration, it rejects with an error.
 * The error message includes the timeout duration and the provided context string (`at`).
 *
 * @example
 * ```ts
 * await withTimeout(async () => {
 *   await someAsyncOperation();
 * }, 5000, "someAsyncOperation");
 * ```
 *
 * @since 1.0.0
 */

export async function withTimeout<T>(task: FunctionLikeType<T | Promise<T>>, delay: number, at: string): Promise<void> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = globalThis?.setTimeout?.(
            () => reject(new Error(`Exceeded timeout of ${ delay } ms at ${ at }`)),
            delay
        );
    });

    try {
        await Promise.race([ task(), timeoutPromise ]);
    } finally {
        globalThis?.clearTimeout?.(timeoutId!);
    }
}

