/**
 * Import will remove at compile time
 */

import type { SuiteErrorInterface } from '@messages/interfaces/messages.interface';

/**
 * Represents timestamp-related information for an event.
 *
 * @remarks
 * Used to track the start time and duration of tests, describes, or suites.
 *
 * @since 1.0.0
 */

export interface EventTimestampInterface {
    /**
     * Duration in milliseconds for the event.
     * @since 1.0.0
     */

    duration?: number;

    /**
     * Timestamp when the event occurred.
     * @since 1.0.0
     */

    timestamp?: Date;
}

/**
 * Represents an individual test and its execution details in JSON format.
 *
 * @remarks
 * Includes information about test ancestry, description, pass/fail status, skipped state,
 * TODO status, and any errors that occurred during execution.
 *
 * @since 1.0.0
 */

export interface JsonTestInterface extends EventTimestampInterface {
    /**
     * Indicates if the test is marked as TODO.
     * @since 1.0.0
     */

    todo?: boolean;

    /**
     * Array of errors that occurred during the test execution.
     * @since 1.0.0
     */

    errors?: Array<SuiteErrorInterface>;

    /**
     * Indicates if the test passed successfully.
     * @since 1.0.0
     */

    passed?: boolean;

    /**
     * Indicates if the test was skipped.
     * @since 1.0.0
     */

    skipped?: boolean;

    /**
     * Ancestry path of the test, showing nesting of `describe` blocks.
     * @since 1.0.0
     */

    ancestry: Array<string>;

    /**
     * Human-readable description of the test.
     * @since 1.0.0
     */

    description: string;
}

/**
 * Represents a `describe` block and its execution details in JSON format.
 *
 * @remarks
 * Includes information about nested tests, nested describes, ancestry, description,
 * skipped state, and any errors that occurred within the describe block.
 *
 * @since 1.0.0
 */

export interface JsonDescribeInterface extends EventTimestampInterface {
    /**
     * Array of tests contained within this describe block.
     * @since 1.0.0
     */

    tests: Array<JsonTestInterface>;

    /**
     * Array of errors that occurred during execution of this describe block.
     * @since 1.0.0
     */

    errors?: Array<SuiteErrorInterface>;

    /**
     * Ancestry path of the `describe` block, showing nesting hierarchy.
     * @since 1.0.0
     */

    ancestry: Array<string>;

    /**
     * Indicates if this `describe` block was skipped.
     * @since 1.0.0
     */

    skipped?: boolean;

    /**
     * Human-readable description of the `describe` block.
     * @since 1.0.0
     */

    description: string;

    /**
     * Array of nested describe blocks within this `describe` block.
     * @since 1.0.0
     */

    describes: Array<JsonDescribeInterface>;
}

/**
 * Represents a test suite and its execution results in JSON format.
 *
 * @remarks
 * Contains the runner information, suite name, any errors at the suite level,
 * and the root describe block that includes all nested describes and tests.
 *
 * @since 1.0.0
 */

export interface JsonSuiteInterface extends EventTimestampInterface {
    /**
     * The name of the runner executing this suite.
     * @since 1.0.0
     */

    runner: string;

    /**
     * The human-readable name of the suite.
     * @since 1.0.0
     */

    suiteName: string;

    /**
     * Array of suite-level errors, if any occurred.
     * @since 1.0.0
     */

    errors?: Array<SuiteErrorInterface>;

    /**
     * The root describe block of the suite containing all nested describes and tests.
     * @since 1.0.0
     */

    rootDescribe: JsonDescribeInterface;
}
