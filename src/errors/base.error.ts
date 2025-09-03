/**
 * Import will remove at compile time
 */

import type { StackTraceInterface } from '@providers/interfaces/stack-provider.interface';

/**
 * Imports
 */

import { formatStack } from '@providers/stack.provider';

/**
 * Base an abstract error class for all xJet-specific errors.
 *
 * Extends the native `Error` class with improved stack trace handling,
 * optional formatted stack traces, and serialization capabilities.
 *
 * @remarks
 * This class is the foundation for all custom xJet error types.
 * It ensures consistent behavior, proper prototype chain setup, and
 * provides methods for serializing the error and accessing a formatted stack trace.
 *
 * @example
 * ```ts
 * // Extending the base error class
 * export class ValidationError extends xJetBaseError {
 *   constructor(message: string) {
 *     super(message);
 *     this.name = 'ValidationError';
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

export abstract class xJetBaseError extends Error {
    /**
     * Stores a pre-formatted stack trace for the error.
     * @since 1.0.0
     */

    protected formattedStack: string | undefined;

    /**
     * Creates a new instance of the base error class.
     *
     * @param message - The error message describing the problem.
     * @param name - Optional error name; defaults to `'xJetError'`.
     *
     * @remarks
     * Properly sets up the prototype chain to ensure `instanceof` works for derived classes.
     * Captures the stack trace if supported by the runtime environment.
     *
     * @example
     * ```ts
     * class MyError extends xJetBaseError {}
     * throw new MyError('Something went wrong');
     * ```
     *
     * @since 1.0.0
     */

    protected constructor(message: string, name: string = 'xJetError') {
        super(message);

        // Ensure a correct prototype chain (important for `instanceof`)
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = name;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Gets the formatted stack trace, if available.
     *
     * @returns The formatted stack trace, or `undefined` if not set.
     *
     * @since 1.0.0
     */

    get formatStack(): string | undefined {
        return this.formattedStack;
    }

    /**
     * Serializes the error instance to a plain object for JSON conversion.
     *
     * @returns A plain object containing all enumerable properties of the error,
     * including `name`, `message`, and `stack`.
     *
     * @remarks
     * Useful for logging, error reporting, or transmitting error details across processes.
     *
     * @example
     * ```ts
     * const error = new xJetError('Validation failed');
     * const json = JSON.stringify(error.toJSON());
     * ```
     *
     * @since 1.0.0
     */

    toJSON(): Record<string, unknown> {
        const json: Record<string, unknown> = {};

        // Copy all own (non-inherited) enumerable properties
        for (const key of Object.keys(this)) {
            const value = this[key as keyof this];
            if(value) json[key] = value;
        }

        // Ensure `name`, `message`, and `stack` are included
        json.name = this.name;
        json.stack = this.stack;
        json.message = this.message;

        return json;
    }

    /**
     * Custom inspect behavior for Node.js console output.
     *
     * @returns The formatted stack trace if available, otherwise the raw stack trace.
     *
     * @since 1.0.0
     */

    [Symbol.for('nodejs.util.inspect.custom')](): string | undefined {
        return this.formattedStack ?? this.stack;
    }

    /**
     * Generates a formatted stack trace using provided options and stores it in `formattedStack`.
     *
     * @param error - The error object to format.
     * @param options - Options controlling stack trace formatting.
     *
     * @remarks
     * This method is intended to be called by derived classes or internal code
     * to prepare a styled or enhanced stack trace for logging or display.
     *
     * @example
     * ```ts
     * class ValidationError extends xJetBaseError {
     *   constructor(message: string) {
     *     super(message);
     *     this.reformatStack(this, { withFrameworkFrames: true });
     *   }
     * }
     * ```
     *
     * @since 1.0.0
     */

    protected reformatStack(error: Error, options?: StackTraceInterface): void {
        this.formattedStack = formatStack(error, options);
    }
}
