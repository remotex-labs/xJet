/**
 * Import will remove at compile time
 */

import type { RunnerInterface } from '@targets/interfaces/traget.interface';
import type { SuiteMapInterface } from '@messages/reports/interfaces/console-reporter.interface';
import type { EndMessageInterface, LogMessageInterface } from '@messages/interfaces/messages.interface';
import type { EndAssertionMessageInterface, SuiteErrorInterface } from '@messages/interfaces/messages.interface';
import type { StartAssertionMessageInterface, StartMessageInterface } from '@messages/interfaces/messages.interface';
import type { SuiteStatsInterface, TestStatsInterface } from '@messages/reports/interfaces/console-reporter.interface';

/**
 * Imports
 */

import { ANSI, writeRaw } from '@remotex-labs/xansi';
import { xterm } from '@remotex-labs/xansi/xterm.component';
import { LogLevel } from '@messages/constants/report.constant';
import { ShadowRenderer } from '@remotex-labs/xansi/shadow.service';
import { AbstractReporter } from '@messages/abstract/report.abstract';
import { ConsoleState, formatStatus, statePrefix, STATIC_HEIGHT } from '@messages/reports/constants/console.constant';

/**
 * Reporter that renders test suite and test results in the console.
 *
 * @remarks
 * The `ConsoleReporter` extends {@link AbstractReporter} and is responsible for:
 * - Rendering suite and test results in real-time using ANSI colors and cursor control.
 * - Tracking per-suite and per-test statistics via {@link SuiteStatsInterface} and {@link TestStatsInterface}.
 * - Maintaining per-suite content for rendering with {@link ShadowRenderer}.
 * - Showing summary of suites and tests, including totals, passed, failed, skipped, and TODO counts.
 *
 * It uses:
 * - `ShadowRenderer` for managing console regions (info and status blocks).
 * - `formatStatus` and `statePrefix` for ANSI-colored output.
 * - `STATIC_HEIGHT` to reserve space for status display at the bottom.
 *
 * @example
 * ```ts
 * const reporter = new ConsoleReporter(LogLevel.Info);
 * reporter.init(['MySuite'], runners);
 * reporter.testStart(testEvent);
 * reporter.testEnd(testEndEvent);
 * reporter.suiteEnd(suiteEndEvent);
 * reporter.finish();
 * ```
 *
 * @since 1.0.0
 */

export class ConsoleReporter extends AbstractReporter {
    /**
     * Timestamp when the reporter started.
     * @since 1.0.0
     */

    private startTime: number = Date.now();

    /**
     * Whether there is only a single runner executing tests.
     * @since 1.0.0
     */

    private isSingleRunner = false;

    /**
     * Interval ID for periodic state updates.
     * @since 1.0.0
     */

    private updateInterval: NodeJS.Timeout | undefined;

    /**
     * Maximum length of runner names, used for padding in the console display.
     * @since 1.0.0
     */

    private maxRunnerNameLength = 0;

    /**
     * ShadowRenderer for displaying per-suite detailed output.
     * @since 1.0.0
     */

    private readonly info: ShadowRenderer;

    /**
     * ShadowRenderer for displaying a summary of all suites and tests.
     * @since 1.0.0
     */

    private readonly status: ShadowRenderer;

    /**
     * Aggregated test counters across all suites.
     * @since 1.0.0
     */

    private tests: Required<TestStatsInterface> = this.createTests();

    /**
     * Aggregated suite counters across all suites.
     * @since 1.0.0
     */

    private suites: Required<SuiteStatsInterface> = this.createSuites();

    /**
     * Map of suite name + runner to per-suite rendering content and stats.
     * @since 1.0.0
     */

    private readonly suiteMap: Map<string, Required<SuiteMapInterface>> = new Map();

    /**
     * Initializes the console reporter.
     *
     * @param logLevel - The log level threshold for output.
     * @param outFilePath - Optional path for writing logs to a file.
     *
     * @remarks
     * Creates `ShadowRenderer` instances for info and status blocks based on terminal size.
     *
     * @since 1.0.0
     */

    constructor(logLevel: LogLevel, outFilePath?: string) {
        super(logLevel, outFilePath);

        const height = process.stdout.rows ?? 24;
        const width = process.stdout.columns ?? 80;

        this.info = new ShadowRenderer(height - STATIC_HEIGHT - 1, width, 1, 0);
        this.status = new ShadowRenderer(STATIC_HEIGHT, width, height - STATIC_HEIGHT, 0);
    }

    /**
     * Initializes the console reporter with suites and runners.
     *
     * @param suites - Array of suite names to track and render.
     * @param runners - Array of runner objects executing the tests.
     *
     * @remarks
     * This method performs the following actions:
     * - Clears the console and hides the cursor using ANSI sequences.
     * - Resets internal start time, test and suite counters.
     * - Determines if only a single runner is executing to adjust formatting.
     * - Starts a periodic interval to update the summary status at the bottom.
     * - Initializes `suiteMap` with per-suite content and counters for each runner.
     * - Prepares each suite title with a pending status using {@link getPrefix}.
     * - Renders all suites immediately using {@link renderSuites}.
     *
     * Each suite in `suiteMap` includes:
     * - `todo`, `total`, `passed`, `failed`, `skipped` counters initialized to `0`.
     * - `title` with `[ Pending ]` status prefix.
     * - Empty `details` array for storing log lines and error messages.
     *
     * @example
     * ```ts
     * reporter.init(['Suite1', 'Suite2'], runners);
     * ```
     *
     * @since 1.0.0
     */

    init(suites: Array<string>, runners: Array<RunnerInterface>): void {
        writeRaw(ANSI.HIDE_CURSOR);
        writeRaw(ANSI.CLEAR_SCREEN);

        this.suiteMap.clear();
        this.startTime = Date.now();
        this.tests = this.createTests();
        this.suites = this.createSuites();
        this.isSingleRunner = runners.length < 2;
        this.updateInterval = setInterval(this.updateState.bind(this), 230);
        this.maxRunnerNameLength = Math.max(...runners.map(r => r.name.length));

        for (const suiteName of suites) {
            for (const runner of runners) {
                const key = this.getSuiteKey(runner.name, suiteName);
                const title = this.getPrefix(ConsoleState.Pending, runner.name, suiteName);
                this.suiteMap.set(key, {
                    todo: 0,
                    total: 0,
                    passed: 0,
                    failed: 0,
                    skipped: 0,
                    title: title,
                    details: []
                });
            }
        }

        this.renderSuites();
    }

    /**
     * Handles a log message emitted by a test or suite and appends it to the corresponding suite details.
     *
     * @param log - The structured log message containing the message, level, ancestry, and optional invocation.
     *
     * @remarks
     * This method performs the following actions:
     * - Ignores the message if its level is below the reporter's `logLevel` or if `LogLevel.Silent` is set.
     * - Ensures the suite exists in `suiteMap` using {@link ensureSuite}.
     * - Formats the log message with:
     *   - Level prefix using {@link getLogPrefix}.
     *   - Ancestry path of the test/describe block.
     *   - Indented multi-line message.
     *   - Optional source code location if `log.invocation` is provided.
     * - Appends each formatted line to the suite's `details` array.
     * - Adds an empty line after each log for separation.
     * - Renders all suites immediately using {@link renderSuites}.
     *
     * @example
     * ```ts
     * reporter.log({
     *   level: 'info',
     *   levelId: LogLevel.Info,
     *   message: 'This is a log message',
     *   runner: 'runner1',
     *   suite: 'MySuite',
     *   ancestry: ['describe1', 'test1'],
     *   timestamp: new Date()
     * });
     * ```
     * @see LogMessageInterface
     * @since 1.0.0
     */

    log(log: LogMessageInterface): void {
        if (log.levelId > this.logLevel || this.logLevel === LogLevel.Silent) return;
        const suite = this.ensureSuite(log.runner, log.suite);

        const lines: Array<string> = [ '' ];
        lines.push(this.getLogPrefix(log) + xterm.gray(` [${ log.ancestry.join(' > ') }]`));
        lines.push(...log.message.split('\n').map(line => ' '.repeat(2) + line));

        if (log.invocation) {
            lines.push(
                xterm.gray(`at (${ log.invocation.source }:${ log.invocation.line }:${ log.invocation.column })`)
            );
        }

        for (const line of lines) {
            suite.details.push(line);
        }

        suite.details.push('');
        this.renderSuites();
    }

    /**
     * Handles the start of a test suite and updates the console display accordingly.
     *
     * @param event - Structured event data containing the runner and suite information.
     *
     * @remarks
     * This method performs the following actions:
     * - Ensures the suite exists in `suiteMap` using {@link ensureSuite}.
     * - Updates the suite title with a running status prefix using {@link getPrefix}.
     * - Renders the updated suites to the console using {@link renderSuites}.
     *
     * This is typically called when the reporter receives a {@link StartMessageInterface} from a test runner.
     *
     * @see StartMessageInterface - Structure of the event data passed to this method.
     * @see ConsoleReporter#getPrefix - Generates the status-prefixed suite title.
     * @see ConsoleReporter#ensureSuite - Ensures the suite exists in the internal map.
     * @see ConsoleReporter#renderSuites - Renders the suite map to the terminal.
     *
     * @since 1.0.0
     */

    suiteStart(event: StartMessageInterface): void {
        const suite = this.ensureSuite(event.runner, event.suite);
        suite.title = this.getPrefix(ConsoleState.Run, event.runner, event.suite);
        this.renderSuites();
    }

    /**
     * Handles the completion of a test suite and updates the console display accordingly.
     *
     * @param event - Structured event data containing suite results, runner information, duration, and optional errors.
     *
     * @remarks
     * This method performs the following actions:
     * - Increments the global suite counter.
     * - Retrieves the suite stats from {@link ensureSuite}.
     * - Determines the suite's final status based on errors, skipped/todo tests, or failed tests.
     * - Updates the suite title with a status prefix and duration using {@link getPrefix}.
     * - Adds formatted error details to the suite if present using {@link parseError}.
     * - Renders the updated suites to the console using {@link renderSuites}.
     *
     * This is typically called when the reporter receives an {@link EndMessageInterface} from a test runner.
     *
     * @see EndMessageInterface - Structure of the event data passed to this method.
     * @see ConsoleReporter#getPrefix - Generates the status-prefixed suite title.
     * @see ConsoleReporter#parseError - Formats and extracts error details for console display.
     * @see ConsoleReporter#ensureSuite - Ensures the suite exists in the internal map.
     * @see ConsoleReporter#renderSuites - Renders the suite map to the terminal.
     *
     * @since 1.0.0
     */

    suiteEnd(event: EndMessageInterface): void {
        this.suites.total += 1;
        const suiteStats = this.ensureSuite(event.runner, event.suite);

        let prefix = ConsoleState.Passed;
        if (event.error) {
            this.suites.failed += 1;
            prefix = ConsoleState.Failed;
        } else if (suiteStats.total === suiteStats.skipped + suiteStats.todo) {
            this.suites.skipped += 1;
            prefix = ConsoleState.Skipped;
        } else if (suiteStats.failed > 0) {
            this.suites.failed += 1;
            prefix = ConsoleState.Failed;
        } else {
            this.suites.passed += 1;
        }

        let title = this.getPrefix(prefix, event.runner, event.suite);
        title += ` ${ (event.duration / 1000).toFixed(3) } s`;
        suiteStats.title = title;

        if (event.error) {
            suiteStats.details.push(...this.parseError(event.error));
        }

        this.renderSuites();
    }

    /**
     * Handles the completion of a `describe` block within a suite and updates its status.
     *
     * @param event - Structured event data containing `describe` block results, runner, suite, and optional errors.
     *
     * @remarks
     * This method performs the following actions:
     * - Retrieves the suite stats from {@link ensureSuite}.
     * - If errors are present, increments the `failed` counter for the suite.
     * - Appends formatted error details to the suite using {@link parseError}.
     *
     * This is typically called when the reporter receives an {@link EndAssertionMessageInterface}
     * event for a `describe` block.
     *
     * @see ConsoleReporter#parseError - Formats and extracts error details for console display.
     * @see ConsoleReporter#ensureSuite - Ensures the suite exists in the internal map.
     * @see EndAssertionMessageInterface - Structure of the event data passed to this method.
     *
     * @since 1.0.0
     */

    describeEnd(event: EndAssertionMessageInterface): void {
        const suiteStats = this.ensureSuite(event.runner, event.suite);

        if (event.errors?.length) {
            suiteStats['failed'] += 1;
            for (const err of event.errors) {
                suiteStats.details.push(...this.parseError(err));
            }
        }
    }

    /**
     * Handles the start of a test case and updates the suite counters for `todo` or skipped tests.
     *
     * @param event - Structured event data containing test start information, runner, suite, and optional `todo`/`skipped` flags.
     *
     * @remarks
     * This method performs the following actions:
     * - Retrieves the suite stats from {@link ensureSuite}.
     * - If the test is marked `todo` or `skipped`, increments the corresponding counters in both
     *   the suite and overall test statistics using {@link incrementTestCounters}.
     *
     * This is typically called when the reporter receives a {@link StartAssertionMessageInterface}
     * event for a test case.
     *
     * @see ConsoleReporter#ensureSuite - Ensures the suite exists in the internal map.
     * @see StartAssertionMessageInterface - Structure of the event data passed to this method.
     * @see ConsoleReporter#incrementTestCounters - Updates the test counters for the suite and global stats.
     *
     * @since 1.0.0
     */

    testStart(event: StartAssertionMessageInterface): void {
        const suiteStats = this.ensureSuite(event.runner, event.suite);

        if (event.todo || event.skipped) {
            this.incrementTestCounters(event.todo ? 'todo' : 'skipped', suiteStats);
        }
    }

    /**
     * Handles the completion of a test case, updates counters, and appends formatted output for the suite.
     *
     * @param event - Structured event data containing test results, runner, suite, duration, ancestry, description, and optional errors.
     *
     * @remarks
     * This method performs the following actions:
     * - Retrieves the suite stats from {@link ensureSuite}.
     * - Increments the total test counters for the suite and global stats.
     * - If the test has errors:
     *   - Marks the test as `failed` via {@link incrementTestCounters}.
     *   - Appends a formatted test line with the ancestry path, description, and duration.
     *   - Adds parsed error details using {@link parseError}.
     * - If no errors are present, marks the test as `passed` via {@link incrementTestCounters}.
     *
     * This is typically called when the reporter receives an {@link EndAssertionMessageInterface}
     * event for a test case.
     *
     * @see ConsoleReporter#parseError - Formats and extracts error details for console display.
     * @see ConsoleReporter#ensureSuite - Ensures the suite exists in the internal map.
     * @see EndAssertionMessageInterface - Structure of the event data passed to this method.
     * @see ConsoleReporter#incrementTestCounters - Updates the test counters for the suite and global stats.
     *
     * @since 1.0.0
     */

    testEnd(event: EndAssertionMessageInterface): void {
        const suiteStats = this.ensureSuite(event.runner, event.suite);

        if (event.errors && event.errors.length > 0) {
            this.incrementTestCounters('failed', suiteStats);

            let testLine = formatStatus.failed(`● ${ event.ancestry.join(' > ') } > ${ event.description }`);
            testLine += xterm.gray(` (${ (event.duration / 1000).toFixed(3) } s)`);
            suiteStats.details.push(testLine);

            for (const err of event.errors) {
                suiteStats.details.push(...this.parseError(err));
            }
        } else {
            this.incrementTestCounters('passed', suiteStats);
        }
    }

    /**
     * Finalizes the console reporter, clears the display, and flushes all pending output.
     *
     * @remarks
     * This method performs the following actions:
     * - Stops the periodic state update interval if it is running.
     * - Updates the console state one last time using {@link updateState}.
     * - Clears both the `info` and `status` {@link ShadowRenderer} buffers.
     * - Flushes all content from the `info` and `status` renderers to the terminal.
     *
     * Typically called after all suites and tests have completed to ensure
     * the console displays the final test results cleanly.
     *
     * @see ConsoleReporter#updateState - Updates the rendered state for suites and tests.
     * @see ShadowRenderer#clearScreen - Clears the renderer buffer.
     * @see ShadowRenderer#flushToTerminal - Outputs the buffered content to the terminal.
     *
     * @since 1.0.0
     */

    finish(): void {
        this.updateInterval?.close();
        this.updateState();

        this.info.clearScreen();
        this.status.clearScreen();
        this.info.flushToTerminal();
        this.status.flushToTerminal();
    }

    /**
     * Generates a unique key for a suite based on the runner name and suite name.
     *
     * @param runner - The name of the runner executing the suite.
     * @param suiteName - The name of the test suite.
     * @returns A string key in the format `{runner}::{suiteName}` used to store and retrieve suite data.
     *
     * @remarks
     * This key is used internally to map each suite per runner in {@link suiteMap}.
     *
     * @see ConsoleReporter#suiteMap - Internal map storing per-suite information.
     *
     * @since 1.0.0
     */

    private getSuiteKey(runner: string, suiteName: string): string {
        return `${ runner }::${ suiteName }`;
    }

    /**
     * Retrieves the suite stats object for a given runner and suite name.
     *
     * @param runner - The name of the runner executing the suite.
     * @param suiteName - The name of the test suite.
     * @returns The corresponding {@link SuiteMapInterface} containing counters, title, and details.
     *
     * @remarks
     * This method uses {@link getSuiteKey} to construct the key for the internal
     * {@link suiteMap} and retrieves the suite information.
     *
     * The returned object is guaranteed to exist if the suite was initialized via {@link init}.
     *
     * @see ConsoleReporter#getSuiteKey - Generates the key used to index the suite map.
     * @see ConsoleReporter#suiteMap - Internal storage of suite stats and details.
     *
     * @since 1.0.0
     */

    private ensureSuite(runner: string, suiteName: string): SuiteMapInterface {
        return this.suiteMap.get(this.getSuiteKey(runner, suiteName))!;
    }

    /**
     * Initializes and returns a fresh test statistics object.
     *
     * @returns A {@link TestStatsInterface} object with all counters set to `0`.
     *
     * @remarks
     * This method is used to reset or initialize the global test counters before
     * execution begins, ensuring all test counts start from zero.
     *
     * @see TestStatsInterface - Defines the counters for tests across all suites.
     *
     * @since 1.0.0
     */

    private createTests(): TestStatsInterface {
        return { total: 0, passed: 0, failed: 0, skipped: 0, todo: 0 };
    }

    /**
     * Creates a new suite statistics object with all counters initialized to zero.
     *
     * @returns A {@link SuiteStatsInterface} object representing the initial state of suite counters.
     *
     * @remarks
     * This method is used to reset or initialize the global suite counters before
     * execution begins. All counters (`total`, `passed`, `failed`, `skipped`) start from `0`.
     *
     * @see SuiteStatsInterface - Interface defining counters for suite execution.
     *
     * @since 1.0.0
     */

    private createSuites(): SuiteStatsInterface {
        return { total: 0, passed: 0, failed: 0, skipped: 0 };
    }

    /**
     * Converts a {@link SuiteErrorInterface} into an array of formatted strings for console output.
     *
     * @param error - The error object containing message, formatted code, and stack trace.
     * @returns An array of strings representing the error, formatted for display in the console.
     *
     * @remarks
     * The returned array contains:
     * - An empty line at the start
     * - The error message split by line
     * - The formatted code lines dimmed using {@link xterm.dim}
     * - The stack trace lines
     * - An empty line at the end
     *
     * This is used internally by the {@link ConsoleReporter} to render detailed error information
     * for failed tests or suites in the shadowed console output.
     *
     * @see SuiteErrorInterface - Structure of the error object.
     * @see xterm.dim - Utility to dim text in console output.
     *
     * @since 1.0.0
     */

    private parseError(error: SuiteErrorInterface): Array<string> {
        const lines = [ '', ...error.message.split('\n'), '' ];
        lines.push(...error.formatCode.split('\n').map(data => xterm.dim(data)), '');
        lines.push(...error.stack.split('\n'), '');

        return lines;
    }

    /**
     * Increments the specified test counter for both the global test stats and the given suite stats.
     *
     * @param counter - The specific counter to increment (`total`, `passed`, `failed`, `skipped`, or `todo`).
     * @param suiteStats - The {@link TestStatsInterface} object representing the suite's current test statistics.
     *
     * @remarks
     * This method updates both the per-suite counters and the overall counters maintained
     * by the {@link ConsoleReporter}. The `total` counter is always incremented alongside
     * the specified counter.
     *
     * @see TestStatsInterface - Interface defining the available test counters.
     *
     * @since 1.0.0
     */

    private incrementTestCounters(counter: keyof TestStatsInterface, suiteStats: TestStatsInterface): void {
        suiteStats.total += 1;
        this.tests.total += 1;
        suiteStats[counter] += 1;
        this.tests[counter] += 1;
    }

    private updateState(): void {
        const suitesParts: Array<string> = [];
        const testsParts: Array<string> = [];

        if (this.suites.failed > 0) suitesParts.push(formatStatus.failed(`${ this.suites.failed } failed`));
        if (this.suites.passed > 0) suitesParts.push(formatStatus.passed(`${ this.suites.passed } passed`));
        if (this.suites.skipped > 0) suitesParts.push(formatStatus.skipped(`${ this.suites.skipped } skipped`));
        if (this.suites.total > 0) suitesParts.push(`${ this.suites.total } total`);

        if (this.tests.failed > 0) testsParts.push(formatStatus.failed(`${ this.tests.failed } failed`));
        if (this.tests.passed > 0) testsParts.push(formatStatus.passed(`${ this.tests.passed } passed`));
        if (this.tests.skipped > 0) testsParts.push(formatStatus.skipped(`${ this.tests.skipped } skipped`));
        if (this.tests.todo > 0) testsParts.push(formatStatus.todo(`${ this.tests.todo } todo`));
        if (this.tests.total > 0) testsParts.push(`${ this.tests.total } total`); // total at the end

        const elapsedSeconds = ((Date.now() - this.startTime) / 1000).toFixed(3);
        this.status.writeBlock(
            0,
            0,
            `Suites:  ${ suitesParts.length ? suitesParts.join(', ') : 'No suites yet' }\n` +
            `Tests:   ${ testsParts.length ? testsParts.join(', ') : 'No tests yet' }\n` +
            `Time:    ${ xterm.lightOrange(`${ elapsedSeconds } s`) }`,
            true
        );
        this.status.render();
    }

    /**
     * Renders the current state of all suites and their test details to the console.
     *
     * @remarks
     * This method iterates over all suites in {@link suiteMap} and writes:
     * - The suite title at the current row
     * - Each suite detail (e.g., test logs, errors) indented by 2 spaces
     *
     * It uses the {@link ShadowRenderer} instances (`info`) to render the content
     * and handles scrolling if the number of rows exceeds the renderer's height.
     * After rendering suites, it calls {@link updateState} to refresh the summary of global counters.
     *
     * @see suiteMap - Map containing per-suite statistics and details.
     * @see ShadowRenderer - Handles writing text to a shadow buffer and flushing to the terminal.
     * @see updateState - Updates the global summary of test and suite counters.
     *
     * @since 1.0.0
     */

    private renderSuites(): void {
        let row = 0;
        for (const [ , suite ] of this.suiteMap) {
            this.info.writeText(row++, 0, suite.title, true);

            for (const detail of suite.details) {
                this.info.writeText(row++, 2, ANSI.CLEAR_LINE + detail, true);
            }
        }

        if (row > this.info.height) {
            this.info.scroll = row - this.info.height;
        } else {
            this.info.render();
        }

        this.updateState();
    }

    /**
     * Generates a formatted prefix for a suite, including its status and runner name.
     *
     * @param status - The current {@link ConsoleState} of the suite (e.g., Run, Passed, Failed).
     * @param runner - The name of the runner executing the suite.
     * @param suiteName - The name of the suite.
     * @returns A formatted string with the suite status, optional runner name, and dimmed suite name.
     *
     * @remarks
     * - If `isSingleRunner` is true, the runner name is omitted.
     * - Uses {@link statePrefix} to map {@link ConsoleState} to a colored label.
     * - Suite name is dimmed for readability using {@link xterm.dim}.
     * - Runner name is colored with `xterm.burntOrange` when multiple runners are present.
     *
     * @see statePrefix
     * @see ConsoleState
     *
     * @since 1.0.0
     */

    private getPrefix(status: ConsoleState, runner: string, suiteName: string): string {
        const runnerPrefix = this.isSingleRunner ? '' :
            xterm.burntOrange(` [ ${ runner.padEnd(this.maxRunnerNameLength) } ]`);

        return `${ statePrefix[status] }${ runnerPrefix } ${ xterm.dim(suiteName) }`;
    }

    /**
     * Generates a formatted ANSI-colored prefix for a log message based on its level.
     *
     * @param log - The {@link LogMessageInterface} containing log level and details.
     * @returns A string representing the log level wrapped with the appropriate ANSI color codes.
     *
     * @remarks
     * - Maps {@link LogLevel} values to {@link formatStatus} or {@link xterm} colors:
     *   - `Error` → `formatStatus.failed`
     *   - `Warn` → `formatStatus.skipped`
     *   - `Info` → `xterm.cyanBright`
     *   - `Debug` → `formatStatus.running`
     *   - Any other or default → `formatStatus.pending`
     * - The returned string is formatted as `[level]` in lowercase, colored according to its severity.
     *
     * @see LogMessageInterface
     * @see LogLevel
     * @see formatStatus
     * @see xterm
     *
     * @since 1.0.0
     */

    private getLogPrefix(log: LogMessageInterface): string {
        let statusPrefix = formatStatus.pending;

        switch (log.levelId) {
            case LogLevel.Error:
                statusPrefix = formatStatus.failed;
                break;
            case LogLevel.Warn:
                statusPrefix = formatStatus.skipped;
                break;
            case LogLevel.Info:
                statusPrefix = xterm.cyanBright;
                break;
            case LogLevel.Debug:
                statusPrefix = formatStatus.running;
                break;
        }

        return statusPrefix(`[ ${ log.level.toLowerCase() } ]`);
    }
}
