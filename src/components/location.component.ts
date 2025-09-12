/**
 * Import will remove at compile time
 */

import type { PacketInvocationInterface } from '@packets/interfaces/packet-schema.interface';

/**
 * Imports
 */

import { parseErrorStack } from '@remotex-labs/xmap/parser.component';

/**
 * Retrieves the location in the source code where this function was invoked.
 *
 * @param position - The stack frame index to inspect (default is 3). This allows skipping
 *                   internal frames to reach the actual caller.
 * @returns A {@link PacketInvocationInterface} containing `line`, `column`, and `source` file
 *          of the invocation, or `undefined` if the location could not be determined.
 *
 * @remarks
 * This function generates a new `Error` to capture the stack trace, parses it using
 * {@link parseErrorStack}, and returns the requested frame as a structured object.
 * It is useful for logging or reporting the exact location of a call within test suites
 * or framework code.
 *
 * @see parseErrorStack
 * @see PacketInvocationInterface
 *
 * @since 1.0.0
 */

export function getInvocationLocation(position: number = 2): PacketInvocationInterface | undefined {
    const errorObject = parseErrorStack(new Error());
    const stack = errorObject.stack[position];

    if (stack?.line && stack?.column && stack?.fileName) {
        return {
            line: stack.line!,
            column: stack.column!,
            source: stack.fileName!
        };
    }

    return undefined;
}

/**
 * Returns a native-style stack trace string,
 * trimmed to start at the specified frame index.
 *
 * @remarks
 * The first line (error name/message) is preserved,
 * while the following lines are sliced starting from `position`.
 *
 * @param position - Index of the first stack frame to include.
 *                   Defaults to `2` to skip this helper and its caller.
 *
 * @returns A string identical in format to `Error.stack`,
 *          or an empty string if the stack is unavailable.
 *
 * @example
 * ```ts
 * console.log(getTrimmedStackString(2));
 * ```
 *
 * @since 3.1.0
 */

export function getTrimmedStackString(position: number = 2): string {
    const err = new Error();
    if (!err.stack) return '';

    const lines = err.stack.split('\n');
    const frames = lines.slice(position + 1);

    return frames.join('\n');
}
