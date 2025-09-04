/**
 * Import will remove at compile time
 */

import type { PromiseRejectType, PromiseResolveType } from '@remotex-labs/xjet-expect';

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
 * Configuration settings for the test runtime environment
 *
 * @since 1.0.0
 */

export interface RuntimeConfigInterface {
    /**
     * Whether to stop test execution after the first failure
     *
     * @since 1.0.0
     */

    bail: boolean;

    /**
     * List of test patterns to filter which tests are executed
     *
     * @since 1.0.0
     */

    filter: Array<string>;

    /**
     * Maximum time in milliseconds allowed for test execution before timeout
     *
     * @since 1.0.0
     */

    timeout: number;

    /**
     * Unique identifier for the test suite being executed
     *
     * @since 1.0.0
     */

    suiteId: string;

    /**
     * Unique identifier for the test runner instance
     *
     * @since 1.0.0
     */

    runnerId: string;

    /**
     * Path to the test file being executed
     *
     * @since 1.0.0
     */

    path: string;

    /**
     * Random test determinism
     *
     * @since 1.0.0
     */

    randomize: boolean;
}

/**
 * Represents an interface for managing running test suites with promise control functions
 *
 * @see PromiseRejectType
 * @see PromiseResolveType
 *
 * @since 1.0.0
 */

export interface RunningSuitesInterface {
    /**
     * Function to reject the promise associated with the running suite
     *
     * @since 1.0.0
     */

    resolve: PromiseRejectType<void>,

    /**
     * Function to resolve the promise associated with the running suite
     *
     * @since 1.0.0
     */

    reject: PromiseResolveType<void>
}
