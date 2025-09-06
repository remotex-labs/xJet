/**
 * Represents the result of a single assertion within a test.
 *
 * @remarks
 * This interface captures the outcome of an assertion and allows
 * for extensible additional properties.
 *
 * @example
 * ```ts
 * const result: AssertionResultInterface = {
 *   name: 'should add numbers correctly',
 *   pass: true,
 *   expected: 4,
 *   received: 4
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface AssertionResultInterface {
    /**
     * Optional name or description of the assertion.
     * @since 1.0.0
     */

    name?: string;

    /**
     * Indicates whether the assertion passed (`true`) or failed (`false`).
     * @since 1.0.0
     */

    pass?: boolean;

    /**
     * Optional message describing the assertion result or reason for failure.
     * @since 1.0.0
     */

    message?: string;

    /**
     * Optional value that was expected in the assertion.
     * @since 1.0.0
     */

    expected?: unknown;

    /**
     * Optional actual value received in the assertion.
     * @since 1.0.0
     */

    received?: unknown;

    /**
     * Additional arbitrary properties relevant to the assertion result.
     * @since 1.0.0
     */

    [key: string]: unknown;
}

/**
 * Represents the invocation point of a test suite in the source code.
 *
 * @remarks
 * This interface captures the location and source of a suite definition,
 * useful for reporting, debugging, or mapping transpiled code back to
 * the original source.
 *
 * @example
 * ```ts
 * const suiteInvocation: SuiteInvocationInterface = {
 *   code: 'describe("MySuite", () => {})',
 *   line: 10,
 *   column: 5,
 *   source: '/path/to/test.spec.ts'
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface SuiteInvocationInterface {
    /**
     * The code string representing the suite invocation.
     * @since 1.0.0
     */

    code: string;

    /**
     * The line number in the source file where the suite is defined.
     * @since 1.0.0
     */

    line: number;

    /**
     * The column number in the source file where the suite starts.
     * @since 1.0.0
     */

    column: number;

    /**
     * The absolute or relative path to the source file containing the suite.
     * @since 1.0.0
     */

    source: string;
}

/**
 * Represents an error that occurred within a test suite.
 *
 * @remarks
 * This interface captures the essential information about a suite-level
 * error, including its location, message, stack trace, and optional
 * assertion result if the error originated from a failed expectation.
 *
 * @example
 * ```ts
 * const error: SuiteErrorInterface = {
 *   code: 'expect(value).toBe(4)',
 *   name: 'AssertionError',
 *   line: 12,
 *   column: 5,
 *   stack: 'Error: ...',
 *   message: 'Expected 3 to be 4',
 *   matcherResult: {
 *     pass: false,
 *     expected: 4,
 *     received: 3
 *   }
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface SuiteErrorInterface {
    /**
     * The code snippet that caused the error.
     * @since 1.0.0
     */

    code: string;

    /**
     * The format code snippet that caused the error.
     * @since 1.0.0
     */

    formatCode: string;

    /**
     * The type or name of the error (e.g., 'AssertionError').
     * @since 1.0.0
     */

    name: string;

    /**
     * The line number in the source file where the error occurred.
     * @since 1.0.0
     */

    line: number;

    /**
     * The column number in the source file where the error occurred.
     * @since 1.0.0
     */

    column: number;

    /**
     * The stack trace of the error.
     * @since 1.0.0
     */

    stack: string;

    /**
     * The human-readable error message.
     * @since 1.0.0
     */

    message: string;

    /**
     * Optional assertion result if the error originated from a failed expectation.
     *
     * @see AssertionResultInterface
     * @since 1.0.0
     */

    matcherResult?: AssertionResultInterface;
}

/**
 * Represents an error that occurs within a test suite.
 *
 * @remarks
 * Provides detailed information about the error, including location in the
 * source file, stack trace, and optionally the result of a failed assertion.
 *
 * @example
 * ```ts
 * const error: SuiteErrorInterface = {
 *   code: 'expect(value).toBe(4)',
 *   name: 'AssertionError',
 *   line: 12,
 *   column: 5,
 *   stack: 'Error: ...',
 *   message: 'Expected 3 to be 4',
 *   matcherResult: {
 *     pass: false,
 *     expected: 4,
 *     received: 3
 *   }
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface SuiteErrorInterface {
    /**
     * The source code snippet that caused the error.
     * @since 1.0.0
     */

    code: string;

    /**
     * The type or name of the error (e.g., 'AssertionError').
     * @since 1.0.0
     */

    name: string;

    /**
     * The line number in the source file where the error occurred.
     * @since 1.0.0
     */

    line: number;

    /**
     * The column number in the source file where the error occurred.
     * @since 1.0.0
     */

    column: number;

    /**
     * The stack trace of the error.
     * @since 1.0.0
     */

    stack: string;

    /**
     * The human-readable error message.
     * @since 1.0.0
     */

    message: string;

    /**
     * Optional result of the assertion that caused the error if applicable.
     * @since 1.0.0
     */

    matcherResult?: AssertionResultInterface;
}

/**
 * Represents a structured log message emitted during test execution.
 *
 * @remarks
 * Log messages are used by reporters to capture runtime information,
 * including standard logs, warnings, errors, and contextual metadata.
 *
 * @example
 * ```ts
 * const log: LogMessageInterface = {
 *   level: 'info',
 *   levelId: 3,
 *   suite: 'loginTests',
 *   runner: 'chrome',
 *   message: 'Test started',
 *   ancestry: ['a', 'b', 'c']
 *   timestamp: new Date(),
 *   invocation: {
 *     code: 'describe("Login", ...)',
 *     line: 10,
 *     column: 5,
 *     source: '/path/to/login.spec.ts'
 *   }
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface LogMessageInterface {
    /**
     * The log level as a string (e.g., 'info', 'error').
     * @since 1.0.0
     */

    level: string;

    /**
     * The name or ID of the suite associated with this log.
     * @since 1.0.0
     */

    suite: string;

    /**
     * The name or ID of the runner that emitted this log.
     * @since 1.0.0
     */

    runner: string;

    /**
     * The numeric representation of the log level.
     * @since 1.0.0
     */

    levelId: number;

    /**
     * The human-readable log message.
     * @since 1.0.0
     */

    message: string;

    /**
     * The timestamp when the log was created.
     * @since 1.0.0
     */

    timestamp: Date;

    /**
     * The hierarchy of parent suites or `describes` or `test` blocks for this assertion.
     * @since 1.0.0
     */

    ancestry: Array<string>;

    /**
     * Optional information about the suite invocation that generated this log.
     *
     * @see SuiteInvocationInterface
     * @since 1.0.0
     */

    invocation?: SuiteInvocationInterface;
}

/**
 * Represents the event emitted when a test suite starts execution.
 *
 * @remarks
 * Reporters can use this event to initialize suite-level logging,
 * display headers, or track suite execution timing.
 *
 * @example
 * ```ts
 * const startEvent: StartMessageInterface = {
 *   suite: 'loginTests',
 *   runner: 'chrome',
 *   timestamp: new Date()
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface StartMessageInterface {
    /**
     * The name or ID of the suite that is starting.
     * @since 1.0.0
     */

    suite: string;

    /**
     * The name or ID of the runner executing this suite.
     * @since 1.0.0
     */

    runner: string;

    /**
     * The timestamp when the suite started execution.
     * @since 1.0.0
     */

    timestamp: Date;
}

/**
 * Represents the event emitted when a test suite finishes execution.
 *
 * @remarks
 * Extends {@link StartMessageInterface} with additional information
 * such as the duration of the suite and any errors encountered.
 * Reporters can use this event to summarize results and handle
 * suite-level failures.
 *
 * @example
 * ```ts
 * const endEvent: EndMessageInterface = {
 *   suite: 'loginTests',
 *   runner: 'chrome',
 *   timestamp: new Date(),
 *   duration: 120,
 *   error: {
 *     code: 'expect(value).toBe(4)',
 *     name: 'AssertionError',
 *     line: 12,
 *     column: 5,
 *     stack: 'Error: ...',
 *     message: 'Expected 3 to be 4'
 *   }
 * };
 * ```
 *
 * @see StartMessageInterface
 * @see SuiteErrorInterface
 *
 * @since 1.0.0
 */

export interface EndMessageInterface extends StartMessageInterface {
    /**
     * The duration of the suite execution in milliseconds.
     * @since 1.0.0
     */

    duration: number;

    /**
     * Optional error that occurred during the suite execution.
     * @since 1.0.0
     */

    error?: SuiteErrorInterface;
}

/**
 * Represents the event emitted when an individual assertion or `describe` or `test` block starts execution.
 *
 * @remarks
 * Extends {@link StartMessageInterface} with additional information specific
 * to assertions, such as ancestry, description, and optional flags for skipped or todo tests.
 * Reporters can use this event to track assertion execution and organize output hierarchically.
 *
 * @example
 * ```ts
 * const startAssertion: StartAssertionMessageInterface = {
 *   suite: 'loginTests',
 *   runner: 'chrome',
 *   timestamp: new Date(),
 *   ancestry: ['Login Suite', 'User Authentication'],
 *   description: 'should log in successfully',
 *   skipped: false
 * };
 * ```
 *
 * @see StartMessageInterface
 *
 * @since 1.0.0
 */

export interface StartAssertionMessageInterface extends StartMessageInterface {
    /**
     * Indicates if the assertion is marked as "todo".
     * @since 1.0.0
     */

    todo?: boolean;

    /**
     * Indicates if the assertion is skipped.
     * @since 1.0.0
     */

    skipped?: boolean;

    /**
     * The hierarchy of parent suites or `describes` blocks for this assertion.
     * @since 1.0.0
     */

    ancestry: Array<string>;

    /**
     * The human-readable description of the assertion.
     * @since 1.0.0
     */

    description: string;
}

/**
 * Represents the event emitted when an individual assertion or `describes` or `test` block finishes execution.
 *
 * @remarks
 * Extends {@link StartMessageInterface} with assertion-specific details
 * such as pass/fail status, errors, ancestry, duration, and description.
 * Reporters can use this event to track results and generate detailed output.
 *
 * @example
 * ```ts
 * const endAssertion: EndAssertionMessageInterface = {
 *   suite: 'loginTests',
 *   runner: 'chrome',
 *   timestamp: new Date(),
 *   passed: false,
 *   errors: [
 *     {
 *       code: 'expect(value).toBe(4)',
 *       name: 'AssertionError',
 *       line: 12,
 *       column: 5,
 *       stack: 'Error: ...',
 *       message: 'Expected 3 to be 4'
 *     }
 *   ],
 *   ancestry: ['Login Suite', 'User Authentication'],
 *   duration: 50,
 *   description: 'should log in successfully'
 * };
 * ```
 *
 * @see StartMessageInterface
 * @see SuiteErrorInterface
 *
 * @since 1.0.0
 */

export interface EndAssertionMessageInterface extends StartMessageInterface {
    /**
     * Indicates whether the assertion passed (`true`) or failed (`false`).
     * @since 1.0.0
     */

    passed: boolean;

    /**
     * Optional array of errors that occurred during this assertion.
     *
     * @see SuiteErrorInterface
     * @since 1.0.0
     */

    errors?: Array<SuiteErrorInterface>;

    /**
     * The hierarchy of parent suites or `describe` blocks for this assertion.
     * @since 1.0.0
     */

    ancestry: Array<string>;

    /**
     * The duration of the assertion execution in milliseconds.
     * @since 1.0.0
     */

    duration: number;

    /**
     * The human-readable description of the assertion.
     * @since 1.0.0
     */

    description: string;
}

