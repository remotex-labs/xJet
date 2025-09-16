/**
 * A base error class that extends the standard Error class with enhanced JSON serialization and location tracking
 *
 * @param message - The error message describing what went wrong
 * @param location - The precise source code location where the error occurred
 * @returns The constructed ExecutionError instance
 *
 * @remarks
 * Serves as a foundation for custom error types in the application.
 * It enhances the native Error object by adding JSON serialization capabilities
 * and source code location information, allowing for better error reporting,
 * debugging, and troubleshooting. The location tracking feature helps pinpoint
 * exactly where in the codebase an error originated.
 *
 * @example
 * ```ts
 * // Creating a basic execution error with location information
 * const error = new ExecutionError(
 *   'Failed to process data',
 *   { line: 42, column: 10 }
 * );
 *
 * // The error can be thrown or used in promise rejection
 * throw error;
 * ```
 *
 * @see InvocationLocationType
 *
 * @since 1.0.0
 */

export class ExecutionError extends Error {

    /**
     * Creates a new ExecutionError instance with the specified error message and source code location
     *
     * @param message - The error message describing what went wrong
     *
     * @remarks
     * This constructor initializes both the standard Error message property and the location
     * information that helps pinpoint exactly where in the codebase the error originated. The
     * location parameter follows the InvocationLocationType structure, typically containing
     * line and column information.
     *
     * @example
     * ```ts
     * const error = new ExecutionError(
     *   'Failed to process input data',
     *   { line: 42, column: 8 }
     * );
     * ```
     *
     * @since 1.0.0
     */

    constructor(message: string) {
        super(message);

        // Assign the name of the error
        this.name = 'xJetExecutionError';
    }

    /**
     * Converts the error instance to a plain JavaScript object for JSON serialization.
     *
     * @returns A plain object containing all properties of the error.
     *
     * @remarks
     * This method enhances error serialization by ensuring all properties from the error
     * instance are properly included in the resulting JSON representation. The standard
     * `JSON.stringify()` method doesn't properly serialize Error objects by default, as
     * their properties are typically not enumerable.
     *
     * @example
     * ```ts
     * const error = new ExecutionError('Something went wrong');
     * error.code = 'ERR_INVALID_INPUT';
     *
     * // Convert to JSON
     * const serialized = JSON.stringify(error);
     * // Result includes all properties: message, name, stack, code, etc.
     * ```
     *
     * @since 1.0.0
     */

    toJSON(): Record<string, unknown> {
        const json: Record<string, unknown> = {};

        for (const key of Object.keys(this)) {
            const value = this[key as keyof this];
            if(value) json[key] = value;
        }

        json.name = this.name;
        json.stack = this.stack;
        json.message = this.message;

        return json;
    }
}
