/**
 * Tracks the current status of all test suites.
 *
 * @remarks
 * This interface provides aggregated statistics for the executed test suites.
 * It shows how many suites have passed, failed, or were skipped, and the total
 * number of suites that have run. These statistics are updated as suites complete
 * and can be used to display overall progress or generate summaries.
 *
 * @example
 * ```ts
 * const suitesStats: SuiteStatsInterface = {
 *   total: 5,    // Total number of suites executed
 *   passed: 3,   // Suites that passed
 *   failed: 1,   // Suites that failed
 *   skipped: 1,  // Suites that were skipped
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface SuiteStatsInterface {
    /**
     * Total number of suites that have run.
     * @since 1.0.0
     */

    total: number;

    /**
     * Number of suites that passed successfully.
     * @since 1.0.0
     */

    passed: number;

    /**
     * Number of suites that failed.
     * @since 1.0.0
     */

    failed: number;

    /**
     * Number of suites that were skipped.
     * @since 1.0.0
     */

    skipped: number;
}

/**
 * Tracks the aggregated status of all tests across all suites.
 *
 * @remarks
 * This interface provides counters for all executed tests, including
 * how many have passed, failed, were skipped, or marked as TODO.
 * The `total` field represents the total number of tests that have run.
 *
 * @example
 * ```ts
 * const allTestsStats: TestStatsInterface = {
 *   total: 20,   // Total number of tests executed across all suites
 *   passed: 15,  // Tests that passed
 *   failed: 3,   // Tests that failed
 *   skipped: 1,  // Tests that were skipped
 *   todo: 1      // Tests marked as TODO
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface TestStatsInterface {
    /**
     * Number of tests marked as TODO.
     * @since 1.0.0
     */

    todo: number;

    /**
     * Total number of tests executed across all suites.
     * @since 1.0.0
     */

    total: number;

    /**
     * Number of tests that passed successfully.
     * @since 1.0.0
     */

    passed: number;

    /**
     * Number of tests that failed.
     * @since 1.0.0
     */

    failed: number;

    /**
     * Number of tests that were skipped.
     * @since 1.0.0
     */

    skipped: number;
}

/**
 * Represents the state and content of a single test suite for rendering.
 *
 * @remarks
 * This interface extends {@link TestStatsInterface} to include additional
 * per-suite details used for console rendering. It tracks the current
 * counts of tests (total, passed, failed, skipped, todo) **within this suite**
 * and provides:
 * - `title`: the current display title of the suite including status.
 * - `details`: the array of log lines, errors, and other messages for rendering
 *   via {@link ShadowRenderer}.
 *
 * @example
 * ```ts
 * const suite: SuiteMapInterface = {
 *   title: "[PASS] MySuite",
 *   details: [
 *     "  Test 1 passed",
 *     "  Test 2 failed: Error message",
 *   ],
 *   total: 2,
 *   passed: 1,
 *   failed: 1,
 *   skipped: 0,
 *   todo: 0
 * };
 * ```
 *
 * @see TestStatsInterface - For test counters within the suite.
 * @see ShadowRenderer - For rendering `details` and `title` in the console.
 *
 * @since 1.0.0
 */

export interface SuiteMapInterface extends TestStatsInterface {
    /**
     * The current display title of the suite, including its status prefix.
     * @since 1.0.0
     */

    title: string;

    /**
     * Array of log lines, error messages, and test details used for console rendering.
     * @since 1.0.0
     */

    details: Array<string>;
}
