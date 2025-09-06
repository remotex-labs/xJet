/**
 * Import will remove at compile time
 */

import type { LogLevel } from '@messages/constants/report.constant';
import type { RunnerInterface } from '@targets/interfaces/traget.interface';
import type { StartAssertionMessageInterface } from '@messages/interfaces/messages.interface';
import type { StartMessageInterface, LogMessageInterface } from '@messages/interfaces/messages.interface';
import type { EndAssertionMessageInterface, EndMessageInterface } from '@messages/interfaces/messages.interface';

/**
 * Base class for implementing custom reporters.
 *
 * @remarks
 * The `AbstractReporter` defines lifecycle hooks that can be implemented
 * by concrete reporter classes to customize how test results are reported.
 *
 * Reporters receive structured event messages during test execution,
 * including suite start/end, describe/test assertions, logs, and finalization.
 *
 * Each method is optional (`?`) and may be implemented depending on
 * the reporter’s needs (e.g., console logging, file output, JSON reporting).
 *
 * @example
 * ```ts
 * class ConsoleReporter extends AbstractReporter {
 *   log(log: LogMessageInterface): void {
 *     console.log(`[LOG] ${log.message}`);
 *   }
 *
 *   suiteStart(event: StartMessageInterface): void {
 *     console.log(`Suite started: ${event.suiteName}`);
 *   }
 * }
 * ```
 *
 * @see RunnerInterface
 * @see LogMessageInterface
 * @see StartMessageInterface
 * @see EndMessageInterface
 *
 * @since 1.0.0
 */

export abstract class AbstractReporter {
    /**
     * Creates a new reporter.
     *
     * @param logLevel - The minimum log level this reporter should handle.
     * @param outFilePath - Optional file path where logs or reports should be written.
     */

    constructor(
        protected readonly logLevel: LogLevel,
        protected readonly outFilePath?: string
    ) {}

    /**
     * Initializes the reporter before test execution starts.
     *
     * @remarks
     * This method is called at the beginning of each test session.
     * In **watch mode**, it will be invoked for every new session restart.
     * Reporters can use this hook to reset the internal state, prepare output files,
     * or print session headers.
     *
     * @param suites - A list of suite names to be executed in this session.
     * @param runners - A list of configured runners available in this session.
     *
     * @since 1.0.0
     */

    init?(suites: Array<string>, runners: Array<RunnerInterface>): void;

    /**
     * Handles log messages emitted during test execution.
     *
     * @param log - The structured log message including level, text,
     *              and optional metadata.
     *
     * @remarks
     * This method is triggered whenever the test code calls
     * `xJet.log()`, `xJet.error()`, or similar logging helpers.
     * Reporters can use this hook to capture, format, and
     * output logs to the console, files, or custom UIs.
     *
     * @see LogMessageInterface
     * @since 1.0.0
     */

    log?(log: LogMessageInterface): void;

    /**
     * Signals the start of a test suite execution.
     *
     * @param event - The structured event containing suite metadata
     *                such as its ID, name, and runner.
     *
     * @remarks
     * Called when a suite begins running. Reporters can use this
     * hook to display suite headers, initialize timers, or log
     * contextual information about the suite.
     *
     * @see StartMessageInterface
     * @since 1.0.0
     */

    suiteStart?(event: StartMessageInterface): void;

    /**
     * Signals the completion of a test suite execution.
     *
     * @param event - The structured event containing final suite
     *                metadata such as its ID, name, duration, and
     *                aggregated results.
     *
     * @remarks
     * Called after a suite has finished running. Reporters can use
     * this hook to display summary information, update progress,
     * or finalize suite-level reporting.
     *
     * @see EndMessageInterface
     * @since 1.0.0
     */

    suiteEnd?(event: EndMessageInterface): void;

    /**
     * Signals the start of a `describe` block execution.
     *
     * @param event - The structured event containing metadata
     *                about the `describe` block, including its
     *                ID, name, and parent context.
     *
     * @remarks
     * Called when a `describe` block begins running. Reporters
     * can use this hook to display section headers, indent logs,
     * or prepare contextual grouping in the output.
     *
     * @see StartAssertionMessageInterface
     * @since 1.0.0
     */

    describeStart?(event: StartAssertionMessageInterface): void;

    /**
     * Signals the completion of a `describe` block execution.
     *
     * @param event - The structured event containing metadata
     *                about the `describe` block, including its
     *                ID, name, duration, and results.
     *
     * @remarks
     * Called after a `describe` block has finished running.
     * Reporters can use this hook to close sections, summarize
     * grouped tests, or adjust indentation and formatting.
     *
     * @see EndAssertionMessageInterface
     * @since 1.0.0
     */

    describeEnd?(event: EndAssertionMessageInterface): void;

    /**
     * Signals the start of an individual test execution.
     *
     * @param event - The structured event containing metadata
     *                about the test, including its ID, name,
     *                and parent suite or `describe` block.
     *
     * @remarks
     * Called when a test begins running. Reporters can use this
     * hook to display test-level headers, start timers, or
     * track progress.
     *
     * @see StartAssertionMessageInterface
     * @since 1.0.0
     */

    testStart?(event: StartAssertionMessageInterface): void;

    /**
     * Signals the completion of an individual test execution.
     *
     * @param event - The structured event containing metadata
     *                about the test, including its ID, name,
     *                duration, and result status.
     *
     * @remarks
     * Called after a test has finished running. Reporters can use
     * this hook to display test results, update progress bars,
     * or log assertion summaries.
     *
     * @see EndAssertionMessageInterface
     * @since 1.0.0
     */

    testEnd?(event: EndAssertionMessageInterface): void;

    /**
     * Called when all suites have finished executing.
     *
     * @remarks
     * This method is invoked at the **end of each test session**.
     * In watch mode, it will be called after every session completes,
     * allowing reporters to finalize logs, write summary files, or
     * perform cleanup for that session.
     *
     * @since 1.0.0
     */

    finish?(): void;
}
