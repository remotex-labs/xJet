/**
 * Import will remove at compile time
 */

import type { LogLevel } from '@reports/abstract/constants/report.constant';
import type { RunnerInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { DescribeEndInterface, LogInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { SuiteStartInterface, TestEndInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { SuiteEndInterface, DescribableInterface } from '@reports/abstract/interfaces/report-abstract.interface';

/**
 * Base class for implementing custom reporters.
 *
 * @remarks
 * Provides abstract methods for handling test suite and test case events.
 * Subclasses should implement the necessary methods based on the reporting requirements.
 *
 * @since 1.0.0
 */

export abstract class AbstractReporter {
    /**
     * Creates a new {@link AbstractReporter} instance.
     *
     * @remarks
     * The `outFilePath` can be provided to specify an output file for the reporter’s results.
     *
     * @param logLevel - Minimum log level that the reporter will handle
     * @param outFilePath - Optional path to a file where reporter output will be saved
     *
     * @since 1.0.0
     */

    constructor(
        protected readonly logLevel: LogLevel,
        protected readonly outFilePath?: string
    ) {}

    /**
     * Initializes the reporter with the test suite names and runners.
     *
     * @remarks
     * The reporter will run once for the execution.
     * The `runners` parameter represents the runners executing the tests:
     *   producing separate results per runner.
     * In watch mode, this method is triggered for each session of test execution.
     *
     * @param suites - Array of suite names
     * @param runners - Array of {@link RunnerInterface} representing all runners
     *
     * @see RunnerInterface
     * @since 1.0.0
     */

    init?(suites: Array<string>, runners: Array<RunnerInterface>): void;

    /**
     * Handles a `log` entry.
     *
     * @param log - The log entry to process
     *
     * @see LogInterface
     * @since 1.0.0
     */

    log?(log: LogInterface): void;

    /**
     * Called when a `suite` starts.
     *
     * @param event - Suite start event information
     *
     * @see SuiteStartInterface
     * @since 1.0.0
     */

    suiteStart?(event: SuiteStartInterface): void;

    /**
     * Called when a `suite` ends.
     *
     * @param event - Suite end event information
     *
     * @see SuiteEndInterface
     * @since 1.0.0
     */

    suiteEnd?(event: SuiteEndInterface): void;

    /**
     * Called when a `describe` block starts.
     *
     * @param event - Describe block start event information
     *
     * @see DescribableInterface
     * @since 1.0.0
     */

    describeStart?(event: DescribableInterface): void;

    /**
     * Called when a `describe` block ends.
     *
     * @param event - Describe block end event information
     *
     * @see DescribeEndInterface
     * @since 1.0.0
     */

    describeEnd?(event: DescribeEndInterface): void;

    /**
     * Called when a `test` case starts.
     *
     * @param event - Test case start event information
     *
     * @see DescribableInterface
     * @since 1.0.0
     */

    testStart?(event: DescribableInterface): void;

    /**
     * Called when a `test` case ends.
     *
     * @param event - Test case end event information
     *
     * @see TestEndInterface
     * @since 1.0.0
     */

    testEnd?(event: TestEndInterface): void;

    /**
     * Finalizes the reporter.
     *
     * @remarks
     * This method is called after all suites and tests have completed.
     * In watch mode, it is called for each session of test execution.
     *
     * @since 1.0.0
     */

    finish?(): void;
}
