/**
 * Represents the severity level of a log entry.
 *
 * @remarks
 * Used in {@link LogInterface} to indicate the importance of a log message.
 *
 * @since 1.0.0
 */

export enum LogLevel {
    /**
     * No logs will be emitted.
     * @since 1.0.0
     */
    SILENT = 0,

    /**
     * Trace messages for fine-grained debugging.
     * @since 1.0.0
     */

    TRACE = 1,

    /**
     * Debug messages, verbose output for developers.
     * @since 1.0.0
     */

    DEBUG = 2,

    /**
     * Informational messages, general debugging.
     * @since 1.0.0
     */

    INFO = 3,

    /**
     * Warnings indicating potential issues.
     * @since 1.0.0
     */

    WARN = 4,

    /**
     * Errors indicating failed operations or test failures.
     * @since 1.0.0
     */

    ERROR = 5
}
