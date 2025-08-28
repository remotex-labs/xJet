/**
 * Represents the severity level of a log entry.
 *
 * @remarks
 * Used in {@link LogInterface} to indicate the importance of a log message.
 *
 * @since 1.0.0
 */

export const enum LogLevel {
    /**
     * Informational messages, typically for general debugging.
     * @since 1.0.0
     */

    INFO = 'info',

    /**
     * Warnings that indicate potential issues but do not fail the test.
     * @since 1.0.0
     */

    WARN = 'warn',

    /**
     * Detailed debugging messages, typically verbose.
     * @since 1.0.0
     */

    DEBUG = 'debug',

    /**
     * Errors indicating failed operations or test failures.
     * @since 1.0.0
     */

    ERROR = 'error'
}
