/**
 * Import will remove at compile time
 */

import type { HookModel } from './hook.model';
import type { TestModel } from '@shared/models/test.model';
import type { ContextType } from '@remotex-labs/xjet-expect';
import type { ContextInterface } from '@shared/models/interfaces/describe-model.interface';
import type { DescribeHooksInterface } from '@shared/models/interfaces/describe-model.interface';
import type { DescribeOptionsInterface } from '@shared/models/interfaces/describe-model.interface';

/**
 * Imports
 */

import { MessageType } from '@messages/constants/report.constant';
import { emitEvent, emitStatus } from '@shared/services/emit.service';
import { HookType } from '@shared/models/constants/hook.model.constants';

/**
 * Represents a test suite container that manages test execution flow and hierarchy
 *
 * @template T - Context type for test execution
 * @param description - The description of the test suite
 * @param describeFlags - Configuration options for the test suite
 * @returns A new DescribeModel instance that can contain tests and nested suites
 *
 * @remarks
 * The DescribeModel manages the execution lifecycle of tests, including
 * - Maintaining parent-child relationships between test suites
 * - Executing hooks in the correct order (beforeAll, beforeEach, afterEach, afterAll)
 * - Tracking test execution status and reporting results
 * - Supporting test filtering with skip/only options
 *
 * @example
 * ```ts
 * const rootSuite = new DescribeModel('Root suite');
 * const testCase = new TestModel('should work', () => {
 *   expect(true).toBe(true);
 * });
 * rootSuite.addTest(testCase);
 * await rootSuite.run({});
 * ```
 *
 * @see TestModel
 * @see HookModel
 * @see DescribeHooksInterface
 *
 * @since 1.0.0
 */

export class DescribeModel {
    /**
     * Array containing the hierarchical path of parent describe blocks for this test suite
     *
     * @since 1.0.0
     */

    readonly ancestry: string[] = [];

    /**
     * Collection of test cases directly contained within this test suite
     *
     * @internal
     * @since 1.0.0
     */

    readonly testsStack: TestModel[] = [];

    /**
     * Collection of nested test suites within this suite
     *
     * @internal
     * @since 1.0.0
     */

    readonly describesStack: DescribeModel[] = [];

    /**
     * Timestamp when the test suite execution started
     *
     * @default 0
     * @internal
     * @since 1.0.0
     */

    private startTime = 0;

    /**
     * Collection of lifecycle hooks for this test suite
     *
     * @internal
     * @since 1.0.0
     */

    private readonly hooks: DescribeHooksInterface = {
        afterAll: [],
        afterEach: [],
        beforeAll: [],
        beforeEach: []
    };

    /**
     * Creates a new test suite with the specified description and options
     *
     * @param description - Human-readable description of the test suite
     * @param describeOptions - Configuration options to control test suite execution
     *
     * @since 1.0.0
     */

    constructor(
        readonly description: string = '',
        private readonly describeOptions: DescribeOptionsInterface = { skip: false, only: false }
    ) {
    }

    /**
     * Retrieves the execution configuration options for this test suite
     *
     * @returns Test suite configuration options
     *
     * @since 1.0.0
     */

    get options(): DescribeOptionsInterface {
        return this.describeOptions;
    }

    /**
     * Gets all tests in this suite, including tests from nested suites
     *
     * @returns Flattened array of all tests in this suite and its children
     *
     * @remarks
     * Recursively collects and flattens all test cases from this suite and any nested suites
     *
     * @since 1.0.0
     */

    get tests(): TestModel[] {
        // Use flatMap for cleaner code and better performance
        return [
            ...this.testsStack,
            ...this.describesStack.flatMap(child => child.tests)
        ];
    }

    /**
     * Registers a hook function to be executed at a specific point in the test lifecycle
     *
     * @param type - The lifecycle point at which to execute the hook
     * @param hook - The hook function model to register
     *
     * @throws Error - If an invalid hook type is provided
     *
     * @since 1.0.0
     */

    addHook(type: HookType, hook: HookModel): void {
        const hookArray = this.hooks[type];
        if (!hookArray) {
            throw new Error(`Invalid hook type: ${ type }`);
        }

        hookArray.push(hook);
    }

    /**
     * Adds a test case to this test suite
     *
     * @param test - The test model to add to the suite
     *
     * @remarks
     * When adding a test, this method automatically:
     * - Updates the test's ancestry to include this suite
     * - Propagates execution options (skip/only) from the suite to the test
     *
     * @since 1.0.0
     */

    addTest(test: TestModel): void {
        if (!test) return;

        test.setAncestry(this.ancestry);
        if (this.description) test.setAncestry([ this.description ]);
        test.applyExecutionFlags(this.options.skip, this.options.only);
        this.testsStack.push(test);
    }

    /**
     * Adds a nested test describe to this test describe
     *
     * @param describe - The child test describe to add
     *
     * @remarks
     * When adding nested describe, this method automatically:
     * - Sets up the parent-child relationship
     * - Propagates execution options and ancestry information from parent to child
     *
     * @since 1.0.0
     */

    addDescribe(describe: DescribeModel): void {
        if (!describe) return;

        describe.inheritFromParentDescribe(this);
        this.describesStack.push(describe);
    }

    /**
     * Executes the test suite and all contained tests
     *
     * @param context - The test execution context containing shared state
     * @returns Promise that resolves when all tests in the suite complete
     *
     * @remarks
     * Execution follows this order:
     * 1. Check if the suite is marked as skipped
     * 2. Execute all beforeAll hooks
     * 3. Run all tests in this suite
     * 4. Run all nested test suites
     * 5. Execute all afterAll hooks
     * If any step fails, the entire suite is marked as failed
     *
     * @example
     * ```ts
     * const suite = new DescribeModel('My test suite');
     * const context = createTestContext();
     * await suite.run(context);
     * ```
     *
     * @since 1.0.0
     */

    async run(context: ContextType<ContextInterface>): Promise<void> {
        this.startTime = Date.now();
        this.notifyDescribeStatus(this.options.skip);
        const afterAllErrorsEmpty = !context.afterAllErrors?.length;
        const beforeAllErrorsEmpty = !context.beforeAllErrors?.length;

        try {
            if (!context.beforeAllErrors?.length)
                await this.executeHooks(HookType.BEFORE_ALL, context);

            for (const test of this.shuffleTests(this.testsStack)) {
                if(context.hasError) return;
                await test.run(context, this.executeHooks.bind(this));
            }

            for (const describe of this.describesStack) {
                if(context.hasError) return;
                await describe.run(context);
            }

            await this.executeHooks(HookType.AFTER_ALL, context);

            if (context.afterAllErrors?.length) this.notifyDescribeFailure(context.afterAllErrors);
            else this.notifyDescribeAction();
        } catch (error) {
            this.notifyDescribeFailure([ error, ...context.afterAllErrors ]);
            if(globalThis.__XJET?.runtime.bail) {
                context.hasError = true;
            }
        } finally {
            if (afterAllErrorsEmpty) context.afterAllErrors = [];
            if (beforeAllErrorsEmpty) context.beforeAllErrors = [];
        }
    }

    /**
     * Inherits properties from a parent test suite
     *
     * @param parent - The parent test describe to inherit from
     *
     * @remarks
     * This method performs the following inheritance operations:
     * - Adds parent's ancestry chain to this suite's ancestry
     * - Propagates the 'skip' flag (if parent is skipped, child is skipped)
     * - Propagates the 'only' flag if the parent has it set
     *
     * @since 1.0.0
     */

    inheritFromParentDescribe(parent: DescribeModel): void {
        this.ancestry.push(...parent.ancestry);
        this.hooks.beforeEach = [ ...parent.hooks.beforeEach, ...this.hooks.beforeEach ];
        this.hooks.afterEach = [ ...parent.hooks.afterEach, ...this.hooks.afterEach ];

        if (parent.description)
            this.ancestry.push(parent.description);

        if (parent.options.skip) {
            this.describeOptions.skip = true;
        }

        if (parent.options.only) {
            this.describeOptions.only = true;
        }
    }

    /**
     * Executes all hooks of the specified type in sequence
     *
     * @param type - The lifecycle hook type to execute
     * @param context - The test execution context
     *
     * @throws Error - When a beforeEach or afterEach hook fails
     *
     * @remarks
     * Errors in beforeAll hooks are collected but don't immediately abort execution.
     * Errors in afterAll hooks are collected for reporting.
     * Errors in beforeEach/afterEach hooks cause immediate test failure.
     *
     * @internal
     * @since 1.0.0
     */

    private async executeHooks(type: HookType, context: ContextType<ContextInterface>): Promise<void> {
        if (this.options.skip) return;
        context.beforeAllErrors = context.beforeAllErrors || [];
        context.afterAllErrors = context.afterAllErrors || [];

        for (const hook of this.hooks[type]) {
            try {
                await hook.run(context);
            } catch (error) {
                await this.handleHookError(type, error, context);
            }
        }
    }

    /**
     * Handles errors that occur during hook execution
     *
     * @param type - The type of hook where the error occurred
     * @param error - The error that was thrown
     * @param context - The test execution context
     *
     * @throws Error - When the error occurs in a beforeEach or afterEach hook
     *
     * @remarks
     * Error handling differs by hook type:
     * - beforeAll: Error is collected but execution continues
     * - afterAll: Error is collected for reporting
     * - beforeEach/afterEach: Error is immediately thrown to fail the test
     *
     * @internal
     *
     * @since 1.0.0
     */

    private async handleHookError(type: HookType, error: unknown, context: ContextType<ContextInterface>): Promise<void> {
        if (type === HookType.BEFORE_ALL) {
            context.beforeAllErrors.push(error);
        } else if (type === HookType.AFTER_ALL) {
            context.afterAllErrors.push(error);
        } else {
            throw error;
        }
    }

    /**
     * Calculates the execution duration of the test suite in milliseconds
     *
     * @returns Duration in milliseconds since the test started, or 0 if not started
     *
     * @remarks
     * Returns the elapsed time between when the suite started execution and the current time
     * If the suite hasn't started (startTime is 0), returns 0 instead
     *
     * @internal
     * @since 1.0.0
     */

    private getExecutionDuration(): number {
        if (this.startTime === 0)
            return 0;

        return Date.now() - this.startTime;
    }

    private notifyDescribeStatus(skip: boolean = false): void {
        emitStatus(MessageType.Describe, {
            skipped: skip,
            ancestry: this.ancestry,
            description: this.description
        });
    }

    private notifyDescribeAction(errors: Array<unknown> = []): void {
        emitEvent(MessageType.Describe, {
            errors: <Array<Error>> errors,
            ancestry: this.ancestry,
            description: this.description,
            duration: this.getExecutionDuration()
        });
    }

    /**
     * Reports test suite failure with associated errors
     *
     * @param errors - Collection of errors that caused the test suite to fail
     *
     * @remarks
     * Skips reporting if no errors are provided
     * Uses notifyDescribeAction to emit a failure event with the error details
     *
     * @internal
     * @since 1.0.0
     */

    private notifyDescribeFailure(errors: Array<unknown>): void {
        if (!errors?.length) return;

        this.notifyDescribeAction(errors);
    }

    /**
     * Randomizes the order of tests in an array using the Fisher-Yates shuffle algorithm
     *
     * @param testsToShuffle - Array of test models to be randomly reordered
     * @returns The same array with elements potentially reordered in a random sequence
     *
     * @remarks
     * The shuffling only occurs if the global randomization flag is enabled
     * (accessed via globalThis.__XJET?.runtime.randomize) and the array has more
     * than one element. The algorithm used is Fisher-Yates shuffle, which ensures
     * each permutation has equal probability.
     *
     * @example
     * ```ts
     * const tests = [new TestModel('test1'), new TestModel('test2')];
     * const randomizedTests = this.shuffleTests(tests);
     * // The order of tests may be different from the original if randomization is enabled
     * ```
     *
     * @internal
     * @since 1.0.0
     */

    private shuffleTests(testsToShuffle: Array<TestModel>): Array<TestModel> {
        const randomize = globalThis.__XJET?.runtime.randomize ?? false;
        if (!randomize || testsToShuffle.length <= 1) return testsToShuffle;
        const length = testsToShuffle.length;

        // Start from the last element and swap with a random element
        // before the current position (including itself)
        for (let i = length - 1; i > 0; i--) {
            // Generate a random index from 0 to i (inclusive)
            const j = Math.floor(Math.random() * (i + 1));

            // Swap elements at indices i and j
            // Use destructuring assignment for a clean swap without a temp variable
            [ testsToShuffle[i], testsToShuffle[j] ] = [ testsToShuffle[j], testsToShuffle[i] ];
        }

        return testsToShuffle;
    }
}
