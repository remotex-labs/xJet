/**
 * Import will remove at compile time
 */

import type { TestModel } from '@shared/models/test.model';
import type { ContextType, FunctionType } from '@remotex-labs/xjet-expect';
import type { ContextInterface, DescribeOptionsInterface } from '@shared/models/interfaces/describe-model.interface';

/**
 * Imports
 */

import { Injectable } from '@symlinks/symlinks.module';
import { emitStatus } from '@shared/services/emit.service';
import { encodeErrorSchema } from '@packets/packets.module';
import { DescribeModel } from '@shared/models/describe.model';
import { ExecutionError } from '@shared/errors/execution.error';
import { MessageType } from '@messages/constants/report.constant';

/**
 * Manages the state of test suites within the testing framework, tracking the hierarchy of describe blocks and test cases.
 * Implemented as a singleton to ensure a single source of truth for the test suite structure.
 *
 * @template TestModel - The model type representing individual test cases
 * @template FunctionType - The function type for describe block implementations
 * @template DescribeModel - The model type representing test suite describe blocks
 * @template DescribeOptionsInterface - Configuration options for describe blocks
 *
 * @throws Error - If you attempt to instantiate this class directly instead of using getInstance()
 *
 * @remarks
 * The singleton pattern ensures that all test registration operations work with the same
 * state instance, properly maintaining the hierarchical structure of tests.
 * Use the static getInstance() method to access the singleton instance.
 *
 * @example
 * ```ts
 * // Get the singleton instance
 * const suiteState = SuiteState.getInstance();
 *
 * // Add a describe block
 * suiteState.addDescribe('My test suite', () => {
 *   // Test suite implementation
 * }, { only: true });
 *
 * // Add a test case to the current describe block
 * suiteState.addTest(new TestModel('should work', () => {}, { skip: false }));
 * ```
 *
 * @see TestModel
 * @see DescribeModel
 *
 * @since 1.0.0
 */

@Injectable({
    scope: 'singleton'
})
export class SuiteState {
    /**
     * Tracks whether any test or describe block has the 'only' flag set
     *
     * @since 1.0.0
     */

    private onlyMode = false;

    /**
     * Reference to the currently active describe block in the test hierarchy
     *
     * @see DescribeModel
     * @since 1.0.0
     */

    private currentDescribe: DescribeModel;

    /**
     * Reference to the test currently being defined or executed
     *
     * @see TestModel
     * @since 1.0.0
     */

    private currentTest?: TestModel;

    /**
     * Suite has at least one test
     * @since 1.0.0
     */

    private hasTests = false;

    /**
     * The top-level describe block that contains all tests and nested describe blocks
     *
     * @see DescribeModel
     * @since 1.0.0
     */

    private readonly rootDescribe: DescribeModel;

    /**
     * Array of regular expressions used for filtering test paths
     *
     * @remarks
     * This array stores regular expressions created from filter strings specified in runtime configuration.
     * Used to determine which tests should be executed when filtering is enabled.
     *
     * @see SuiteState.matchesFilter - Method that uses these regex patterns for test filtering
     * @since 1.0.0
     */

    private readonly filterRegexChain: Array<RegExp> = [];

    /**
     * Creates a new instance of the class with a root describe block
     *
     * @internal
     * @since 1.0.0
     */

    constructor() {
        this.rootDescribe = new DescribeModel();
        this.currentDescribe = this.rootDescribe;

        if (Array.isArray(__XJET?.runtime.filter) && __XJET.runtime.filter.length > 0) {
            this.onlyMode = true;
            this.filterRegexChain = __XJET.runtime.filter.map(
                (part: string) => new RegExp(`^${ part }$`)
            );
        }
    }

    /**
     * Checks if a test path matches the provided regular expression filter patterns
     *
     * This method compares a test's full path (including ancestry and description) against one or more
     * regular expression patterns to determine if the test should be included in execution.
     *
     * @param path - Array of path segments representing test ancestry and description
     * @param filter - Array of RegExp objects to test against the path
     * @returns Boolean indicating whether the path matches the filter patterns
     *
     * @throws Error - When invalid regular expressions are provided
     *
     * @remarks
     * The method aligns the filter from the end of the path, allowing partial matching of nested test structures.
     * This is particularly useful for selecting specific test cases within a larger test hierarchy.
     *
     * @example
     * ```ts
     * // Match tests with description containing "login"
     * const matches = SuiteState.matchesFilter(
     *   ['Auth', 'User', 'should handle login correctly'],
     *   [/login/i]
     * );
     * // Returns: true
     *
     * // Match specific test path structure
     * const matches = SuiteState.matchesFilter(
     *   ['API', 'GET', 'should return 200 status'],
     *   [/API/, /GET/, /status/]
     * );
     * // Returns: true
     * ```
     *
     * @see filterChain - String-based alternative for exact matching
     * @see addTest - Method that uses matchesFilter to determine which tests to run
     *
     * @since 1.0.0
     */

    static matchesFilter(path: string[], filter: RegExp[]): boolean {
        if (filter.length > path.length) return false;

        // Align from the end of the path
        const offset = path.length - filter.length;

        return filter.every((re, i) => re.test(path[offset + i]));
    }

    /**
     * Indicates whether the test suite is running in "only" mode
     *
     * @returns True if only specifically marked tests should run
     *
     * @since 1.0.0
     */

    get isOnlyMode(): boolean {
        return this.onlyMode;
    }

    /**
     * Gets the root describe block of the test suite
     *
     * @returns The top-level describe block
     *
     * @see DescribeModel
     * @since 1.0.0
     */

    get root(): DescribeModel {
        return this.rootDescribe;
    }

    /**
     * Gets the current describe block being defined
     *
     * @returns The active describe block
     *
     * @see DescribeModel
     * @since 1.0.0
     */

    get describe(): DescribeModel {
        return this.currentDescribe;
    }

    /**
     * Gets the test currently being defined or executed
     *
     * @returns The current test or null if no test is active
     *
     * @see TestModel
     * @since 1.0.0
     */

    get test(): TestModel | undefined {
        return this.currentTest;
    }

    /**
     * Sets the current test being defined or executed
     *
     * @param test - The test to set as current
     *
     * @see TestModel
     * @since 1.0.0
     */

    set test(test: TestModel | undefined) {
        this.currentTest = test;
    }

    /**
     * Executes the entire test suite from the root describe block
     *
     * @param context - The execution context containing runtime information
     *
     * @throws Error - When test execution fails, the error is encoded and dispatched
     *
     * @remarks
     * This method initiates the test execution flow by calling run() on the root describe block
     * and emits an END status notification when all tests complete successfully. If an error
     * occurs during execution, it's captured, encoded, and dispatched through the error schema.
     *
     * @example
     * ```ts
     * const suiteState = SuiteState.getInstance();
     * await suiteState.run({
     *   timeout: 5000,
     *   currentPath: '/tests',
     *   skipAfterFailure: true
     * });
     * ```
     *
     * @see emitStatus
     * @see DescribeModel
     *
     * @since 1.0.0
     */

    async run(context: ContextType<ContextInterface>): Promise<void> {
        try {
            const time = Date.now();
            emitStatus(MessageType.StartSuite);
            if (!this.hasTests)
                throw new ExecutionError('Your test suite must contain at least one test');

            await this.root.run(context);
            emitStatus(MessageType.EndSuite, { duration: Date.now() - time });
        } catch (e) {
            dispatch(
                encodeErrorSchema(<Error>e, __XJET.runtime.suiteId, __XJET.runtime.runnerId)
            );
        }
    }

    /**
     * Adds a new describe block to the test suite hierarchy
     *
     * @param description - The textual description of the describe block
     * @param describeFn - The function containing the tests and nested describes
     * @param flags - Configuration options for the describe block
     * @param describeArgs - Arguments to pass to the describe function
     *
     * @throws Error - If the describe function throws any exceptions
     *
     * @remarks
     * This method temporarily changes the current describe context while executing
     * the describeFn, then restores it afterward, ensuring proper nesting of test blocks.
     * If the 'only' flag is set, it enables only-mode for the entire test suite.
     *
     * @example
     * ```ts
     * suiteState.addDescribe(
     *   'my test group',
     *   () => {
     *     // test definitions here
     *   },
     *   { only: true }
     * );
     * ```
     *
     * @see FunctionType
     * @see DescribeModel
     * @see DescribeOptionsInterface
     *
     * @since 1.0.0
     */

    addDescribe(description: string, describeFn: FunctionType, flags: DescribeOptionsInterface = {}, describeArgs: Array<unknown> = []): void {
        const options = { skip: false, only: false, ...flags };
        if (options.only) {
            this.onlyMode = true;
        }

        if (this.filterRegexChain.length > 0) {
            const fullPath = [
                ...this.currentDescribe.ancestry,
                this.currentDescribe.description,
                description
            ];

            if (SuiteState.matchesFilter(fullPath, this.filterRegexChain)) {
                options.only = true;
            }
        }

        const newDescribe = new DescribeModel(description, options);
        this.currentDescribe.addDescribe(newDescribe);
        const previousDescribe = this.currentDescribe;
        this.currentDescribe = newDescribe;

        try {
            describeFn.apply({}, describeArgs);
        } finally {
            this.currentDescribe = previousDescribe;
        }
    }

    /**
     * Adds a test to the current describe block
     *
     * @param test - The test model to add
     *
     * @remarks
     * If the test has the 'only' option set, it enables only-mode for the entire test suite.
     *
     * @see TestModel
     * @since 1.0.0
     */

    addTest(test: TestModel): void {
        // Mark the suite as having at least one test
        this.hasTests = true;

        if (test.options.only) this.onlyMode = true;
        this.currentDescribe.addTest(test);

        if (this.filterRegexChain.length > 0) {
            const fullPath = [ ...test.ancestry, test.description ];

            if (SuiteState.matchesFilter(fullPath, this.filterRegexChain)) {
                test.options.only = true;
            }
        }
    }
}
