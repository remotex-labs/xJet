/**
 * Import will remove at compile time
 */

import type { ErrorEventInterface, RunnerInterface } from '@reports/abstract/interfaces/report-abstract.interface';

/**
 * Represents timing information for a test, describe block, or suite.
 *
 * @remarks
 * Can be used to track execution duration and a single timestamp (e.g., start or end time).
 *
 * @property duration - Optional duration of the event in milliseconds
 * @property timestamp - Optional timestamp of the event as a {@link Date} object
 *
 * @since 1.0.0
 */

export interface EventTimestampInterface {
    duration?: number;
    timestamp?: Date;
}

/**
 * Represents a single test entry in a JSON reporter output.
 *
 * @remarks
 * This interface is used to serialize the results of a test, including logs,
 * errors, timestamps, and metadata about its position within the test suite hierarchy.
 *
 * @property todo - Optional flag indicating that the test is marked as TODO
 * @property errors - Optional array of errors encountered during the test
 * @property passed - Optional flag indicating whether the test passed
 * @property skipped - Optional flag indicating whether the test was skipped
 * @property ancestry - Array of parent descriptions leading to this test
 * @property description - Description of the test
 *
 * @see ErrorEventInterface
 * @see EventTimestampInterface
 *
 * @since 1.0.0
 */

export interface JsonTestInterface extends EventTimestampInterface {
    todo?: boolean;
    errors?: Array<ErrorEventInterface>;
    passed?: boolean;
    skipped?: boolean;
    ancestry: Array<string>;
    description: string;
}

/**
 * Represents a `describe` block in a JSON reporter output.
 *
 * @remarks
 * This interface is used to serialize a `describe` block, including its child tests,
 * nested describes, logs, errors, timestamps, and metadata about its position in the test suite hierarchy.
 *
 * @property tests - Array of tests contained within this describe block
 * @property errors - Optional array of errors encountered within this describe block
 * @property ancestry - Array of parent descriptions leading to this describe block
 * @property skipped - Optional flag indicating whether the `describe` block was skipped
 * @property description - Description of the describe block
 * @property describes - Array of nested describe blocks
 *
 * @see JsonTestInterface
 * @see EventTimestampInterface
 *
 * @since 1.0.0
 */

export interface JsonDescribeInterface extends EventTimestampInterface {
    tests: Array<JsonTestInterface>;
    errors?: Array<ErrorEventInterface>;
    ancestry: Array<string>;
    skipped?: boolean;
    description: string;
    describes: Array<JsonDescribeInterface>;
}

/**
 * Represents a test suite in a JSON reporter output.
 *
 * @remarks
 * Extends {@link EventTimestampInterface} to track start time, end time, and duration.
 * Includes the runner information, errors, and the root describe block. Used to serialize
 * the results of an entire test suite, including nested `describes` and tests.
 *
 * @property runner - The runner executing this suite
 * @property suiteName - Name of the test suite associated with the runner
 * @property errors - Optional array of errors encountered during the suite
 * @property rootDescribe - The root describe block of the suite
 *
 * @see RunnerInterface
 * @see JsonDescribeInterface
 * @see EventTimestampInterface
 *
 * @since 1.0.0
 */

export interface JsonSuiteInterface extends EventTimestampInterface {
    runner: RunnerInterface;
    suiteName: string;
    errors?: Array<ErrorEventInterface>;
    rootDescribe: JsonDescribeInterface;
}
