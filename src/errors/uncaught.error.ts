/**
 * Imports
 */

import { xJetBaseError } from '@errors/base.error';
import { formatStack } from '@providers/stack.provider';

/**
 * Global handler for uncaught exceptions in Node.js.
 *
 * @param reason - The value or error object representing the uncaught exception
 *
 * @throws This handler does not throw, but catches uncaught exceptions
 *
 * @remarks
 * When an uncaught exception occurs, this handler logs the error using {@link formatStack}
 * with both framework and native frames included, and then terminates the process
 * with exit code `1`, signaling failure.
 *
 * @example
 * ```ts
 * // Automatically registered when this file is loaded,
 * throw new Error('This error will be logged and exit the process');
 * ```
 *
 * @see formatStack
 * @see process.exit
 * @see {@link https://nodejs.org/api/process.html#event-uncaughtexception | Node.js documentation on 'uncaughtException'}
 *
 * @since 1.0.0
 */

process.on('uncaughtException', (reason: unknown) => {
    if(reason instanceof Error && !(reason instanceof xJetBaseError)) {
        console.error(formatStack(reason, { withFrameworkFrames: true, withNativeFrames: true }));
    } else {
        console.error(reason);
    }


    process.exit(1);
});

/**
 * Global handler for unhandled promise rejections in Node.js.
 *
 * @param reason - The value or error object representing the reason for the unhandled promise rejection
 *
 * @throws This handler does not throw, but catches unhandled promise rejections
 *
 * @remarks
 * When an unhandled promise rejection occurs, this handler logs the error using {@link formatStack}
 * with both framework and native frames included, and then terminates the process
 * with exit code `2`. Using a distinct exit code allows differentiating between uncaught exceptions
 * and unhandled promise rejections.
 *
 * @example
 * ```ts
 * // Automatically registered when this file is loaded
 * Promise.reject(new Error('This rejection will be logged and exit the process'));
 * ```
 *
 * @see formatStack
 * @see process.exit
 * @see {@link https://nodejs.org/api/process.html#process_event_unhandledrejection | Node.js documentation on 'unhandledRejection'}
 *
 * @since 1.0.0
 */

process.on('unhandledRejection', (reason: unknown) => {
    if(reason instanceof Error && !(reason instanceof xJetBaseError)) {
        console.error(formatStack(reason, { withFrameworkFrames: true, withNativeFrames: true }));
    } else {
        console.error(reason);
    }

    process.exit(2);
});

