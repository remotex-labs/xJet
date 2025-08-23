/**
 * Import will remove at compile time
 */

import type { StackTraceInterface } from '@providers/interfaces/stack-provider.interface';

/**
 * Imports
 */

import { xJetBaseError } from '@errors/base.error';

/**
 * Represents a generic xJet framework error.
 *
 * Extends {@link xJetBaseError} and automatically formats the stack trace
 * according to the provided options.
 *
 * @remarks
 * This class is intended for general-purpose errors within the xJet framework.
 * The stack trace is formatted automatically during construction, with
 * framework-specific frames included by default.
 *
 * @example
 * ```ts
 * throw new xJetError('An unexpected error occurred');
 * ```
 *
 * @since 1.0.0
 */

export class xJetError extends xJetBaseError {

    /**
     * Creates a new instance of `xJetError`.
     *
     * @param message - The error message to display
     * @param options - Optional stack trace formatting options (default includes framework frames)
     *
     * @remarks
     * The constructor passes the message to the base `xJetBaseError` class,
     * then reformats the stack trace using {@link xJetBaseError.reformatStack}.
     *
     * @since 1.0.0
     */

    constructor(message: string, options: StackTraceInterface = { withFrameworkFrames: true }) {
        // Pass the message to the base class Error
        super(message);
        this.reformatStack(this, options);
    }
}
