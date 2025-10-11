/**
 * Defines the log verbosity levels for reporters and test execution.
 *
 * @remarks
 * Each level represents the minimum severity of messages that should be
 * captured or displayed. Higher levels include all messages from lower levels.
 *
 * @example
 * ```ts
 * if (log.level >= LogLevel.Warn) {
 *   console.warn(log.message);
 * }
 * ```
 *
 * @since 1.0.0
 */

export enum LogLevel {
    Silent = 0,
    Error = 1,
    Warn = 2,
    Info = 3,
    Debug = 4
}

/**
 * Defines the types of messages emitted during test execution.
 *
 * @remarks
 * These message types are used internally by reporters, runners,
 * and event emitters to categorize test events. Each type corresponds
 * to a specific stage or element of the test lifecycle.
 *
 * @example
 * ```ts
 * if (message.type === MessageType.Test) {
 *   console.log('Test event received');
 * }
 * ```
 *
 * @since 1.0.0
 */

export const enum MessageType {
    Test = 1,
    Describe = 2,
    EndSuite = 3,
    StartSuite = 4,
    CompileSuite = 5
}
