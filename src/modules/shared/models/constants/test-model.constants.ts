/**
 * Enum representing the types of test execution methods available.
 *
 * @remarks
 * This enum defines three different modes of executing tests:
 * - `SYNC`: Synchronous execution, where tests are executed in sequence.
 * - `ASYNC`: Asynchronous execution, where tests are executed using asynchronous logic.
 * - `CALLBACK`: Callback-based execution, where a callback function is used to signal completion.
 *
 * @since 1.0.0
 */

export const enum TestExecutionType {
    SYNC = 'SYNC',
    ASYNC = 'ASYNC',
    CALLBACK = 'CALLBACK'
}
