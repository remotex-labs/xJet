/**
 * Import will remove at compile time
 */

import type { LogLevel } from '@reports/constants/report.constant';
import type { AbstractReporter } from '@reports/abstract/report.abstract';

/**
 * Represents the location of an invocation in a source file.
 *
 * @property line - The line number of the invocation
 * @property column - The column number of the invocation
 * @property source - The source file path or identifier
 *
 * @since 1.0.0
 */

export interface InvocationLocationInterface {
    line: number;
    column: number;
    source: string;
}

/**
 * Represents a test runner.
 *
 * @property id - Unique identifier of the runner
 * @property name - Name of the runner
 *
 * @since 1.0.0
 */

export interface RunnerInterface {
    id: string;
    name: string;
}

/**
 * Represents an error event in a test.
 *
 * @property code - The error code
 * @property name - The error name
 * @property line - The line number where the error occurred
 * @property column - The column number where the error occurred
 * @property message - The error message
 * @property stacks - Stack trace of the error
 *
 * @since 1.0.0
 */

export interface ErrorEventInterface {
    code: string;
    name: string;
    line: number;
    column: number;
    stacks: string;
    message: string;
}

/**
 * Represents the start of a test suite execution.
 *
 * @property runner - The runner executing the suite
 * @property suiteName - Name of the test suite associated with the runner
 * @property timestamp - Timestamp of when the suite started
 *
 * @see RunnerInterface
 * @since 1.0.0
 */

export interface SuiteStartInterface {
    runner: RunnerInterface;
    suiteName: string;
    timestamp: Date;
}

/**
 * Represents an entity that can be described within a test suite.
 *
 * @remarks
 * Extends {@link SuiteStartInterface} with additional description properties.
 *
 * @property skipped - Optional flag indicating whether the entity was skipped
 * @property ancestry - Array of parent descriptions leading to this entity
 * @property description - Description of the entity
 *
 * @see SuiteStartInterface
 * @since 1.0.0
 */

export interface DescribableInterface extends SuiteStartInterface {
    ancestry: Array<string>;
    description: string;
}

/**
 * Represents a log entry during test execution.
 *
 * @remarks
 * Extends {@link SuiteStartInterface} with logging-specific properties.
 *
 * @property scope - Scope of the log entry
 * @property level - Log level of the entry
 * @property message - Log message
 * @property ancestry - Array of parent descriptions leading to this entity
 * @property location - Optional source location of the log
 *
 * @see Scope
 * @see LogLevel
 * @see InvocationLocationInterface
 *
 * @since 1.0.0
 */

export interface LogInterface extends SuiteStartInterface {
    level: LogLevel;
    message: string;
    ancestry: Array<string>;
    location?: InvocationLocationInterface;
}

/**
 * Represents the end of a test suite execution.
 *
 * @remarks
 * Extends {@link SuiteStartInterface} with optional error reporting
 * and the duration of the suite execution.
 *
 * @property errors - Optional array of errors encountered during the suite
 * @property duration - Duration of the suite execution in milliseconds
 *
 * @see ErrorEventInterface
 * @see SuiteStartInterface
 * @since 1.0.0
 */

export interface SuiteEndInterface extends SuiteStartInterface {
    errors?: Array<ErrorEventInterface>;
    duration: number;
}

/**
 * Represents the end of a `describe` block in a test suite.
 *
 * @remarks
 * Extends {@link SuiteStartInterface} and {@link DescribableInterface} with optional errors
 * and the duration of the describe block execution.
 *
 * @property errors - Optional array of errors encountered in the describe block
 * @property duration - Duration of the describe block execution in milliseconds
 *
 * @see ErrorEventInterface
 * @see SuiteStartInterface
 * @see DescribableInterface
 *
 * @since 1.0.0
 */

export interface DescribeEndInterface extends DescribableInterface {
    errors?: Array<ErrorEventInterface>;
    skipped?: boolean;
    duration: number;
}

/**
 * Represents the end of a test case execution.
 *
 * @remarks
 * Extends {@link SuiteStartInterface} and {@link DescribableInterface} with test result details,
 * including the test duration.
 *
 * @property todo - Optional flag indicating the test is marked as TODO
 * @property errors - Optional array of errors encountered during the test
 * @property passed - Flag indicating whether the test passed
 * @property duration - Duration of the test execution in milliseconds
 *
 * @see ErrorEventInterface
 * @see SuiteStartInterface
 * @see DescribableInterface
 *
 * @since 1.0.0
 */

export interface TestEndInterface extends DescribeEndInterface {
    todo?: boolean;
    passed: boolean;
}

/**
 * Represents a constructor type for creating instances of {@link AbstractReporter}.
 *
 * @remarks
 * Used when dynamically instantiating a reporter with a given log level and optional output file path.
 *
 * @param logLevel - Minimum log level that the reporter will handle
 * @param outFilePath - Optional path to a file where reporter output will be saved
 *
 * @see AbstractReporter
 * @since 1.0.0
 */

export type ReporterConstructorType = new (logLevel: LogLevel, outFilePath?: string) => AbstractReporter;
