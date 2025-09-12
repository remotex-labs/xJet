/**
 * Import will remove at compile time
 */

import type { ContextType, FunctionType } from '@remotex-labs/xjet-expect';
import type { CallbackHandlerType } from '@shared/models/interfaces/hook-model.interface';


/**
 * Imports
 */

import { isPromise } from '@remotex-labs/xjet-expect';
import { withTimeout } from '@components/timeout.component';

/**
 * Represents a model for managing and executing hook functions with a specified timeout.
 * Provides functionality for associating invocation locations and handling errors during execution.
 *
 * @remarks
 * This class ensures that hooks are executed with proper timeout enforcement
 * and supports both synchronous and asynchronous hook functions.
 * It throws an error if an asynchronous hook
 * incorrectly uses a "done" callback or if it fails to complete execution within the specified timeout.
 *
 * @since 1.0.0
 */

export class HookModel {
    /**
     * Represents the current location of an invocation within the application or a fallback to undefined.
     *
     * @remarks
     * This variable is designed
     * to hold the interface representing the invocation's location for tracking.
     * If no invocation location is available, it defaults to undefined.
     *
     * @since 1.0.0
     */

    private location: string = '';

    /**
     * Constructs an instance of the class.
     *
     * @param hookFunction - The callback function that will be executed based on specific conditions.
     * @param timeout - The time in milliseconds before the callback function is triggered.
     * @throws Will throw an error if the provided timeout value is negative or invalid.
     *
     * @remarks This constructor sets up the necessary callback function and timeout configuration for the instance.
     *
     * @since 1.0.0
     */

    constructor(
        private readonly hookFunction: CallbackHandlerType, private readonly timeout: number
    ) {}

    /**
     * Sets the location of the invocation based on the provided location object.
     *
     * @param location - An object implementing the `InvocationLocationType` or `undefined`
     *                   to reset the location.
     *
     * @remarks
     * This method assigns a new location value to the current location of the invocation.
     * Passing `undefined` will clear the current location.
     *
     * @since 1.0.0
     */

    setLocation(location: string): void {
        this.location = location;
    }

    /**
     * Executes a hook function with a timeout mechanism.
     *
     * @param context - The context object passed to the hook function, containing execution-specific information.
     * @return A promise that resolves when the hook function completes its execution successfully.
     *
     * @throws TimeoutError - If the hook function does not call `done()` within the specified timeout duration.
     *
     * @remarks This method concurrently runs the hook function and a timeout check, ensuring that execution does not
     * exceed the predefined timeout.
     * If the timeout is reached without the hook function completing, an ` TimeoutError ` is thrown.
     *
     * @since 1.0.0
     */

    async run(context: ContextType<unknown>): Promise<void> {
        return withTimeout<void>(
            this.executeHook(this.hookFunction, context),
            this.timeout,
            'hook while waiting for \'done()\' to be called.',
            this.location
        );
    }

    /**
     * Executes a given hook function, handling both synchronous and asynchronous hooks,
     * with or without a callback mechanism.
     *
     * @param hook - The function representing the hook to be executed.
     * It Can be a synchronous or asynchronous function.
     * @param context - An object to be used as the `this` context
     *                  when invoking the hook function.

     * @remarks This method ensures correct execution and error handling
     *          for both callback-based and promise-based hooks.
     *
     * @since 1.0.0
     */

    private async executeHook(hook: FunctionType, context: unknown): Promise<void> {
        if (isPromise(hook) && hook.length > 0) {
            throw new Error(`Async hook '${ hook.name }' should not use 'done' callback.`);
        }

        if (hook.length > 0) {
            return this.executeCallbackHook(hook, context);
        }

        return hook.call(context);
    }

    /**
     * Executes a callback-style hook by wrapping it in a Promise
     *
     * @param hook - The callback hook function to execute
     * @param context - Execution context to bind to the hook function
     * @returns A Promise that resolves when the hook completes or rejects when it fails
     *
     * @throws Error - When the hook callback is invoked with an error parameter
     *
     * @remarks This method converts traditional Node.js-style callback patterns (error-first callbacks)
     * into Promise-based async/await compatible functions. The hook function receives a done callback
     * as its argument and must call it to signal completion.
     *
     * @example
     * ```ts
     * const callbackHook = (done) => {
     *   setTimeout(() => done(), 100);
     * };
     *
     * await executeCallbackHook(callbackHook, this);
     * ```
     *
     * @see isPromise
     * @since 1.0.0
     */

    private executeCallbackHook(hook: FunctionType, context: unknown): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            hook.call(context, (error?: string | { message: string }): void => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}
