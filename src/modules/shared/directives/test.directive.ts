/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';
import type { TestFlagsType } from '@shared/models/interfaces/test-model.interface';
import type { TestCallbackType, TestDirectiveInterface } from '@shared/directives/interfaces/test-directive.interface';

/**
 * Imports
 */

import { each } from './each.directive';
import { TestModel } from '@shared/models/test.model';
import { SuiteState } from '@shared/states/suite.state';
import { inject } from '@symlinks/services/inject.service';
import { getTrimmedStackString } from '@components/location.component';

/**
 * Implementation of the test directive that allows for test definition with chainable modifiers.
 * Acts as a function that can be invoked directly while also providing chainable property access.
 *
 * @template T - Type parameter for the test callback return type
 *
 * @param description - The test description
 * @param block - The test implementation function
 * @param timeout - Optional timeout in milliseconds
 *
 * @returns void
 *
 * @throws Error - When attempting to nest tests inside other tests
 * @throws Error - When using incompatible flag combinations (e.g., skip with only)
 *
 * @remarks
 * This class extends Function to allow it to be invoked as a function while also
 * providing methods and properties. It uses a Proxy to capture function invocations
 * and redirects them to the invoke method.
 *
 * @example
 * ```ts
 * // Basic test
 * test('should work', () => {
 *   expect(2 + 2).toBe(4);
 * });
 *
 * // With modifiers
 * test.only('runs exclusively', () => {
 *   expect(true).toBe(true);
 * });
 *
 * // Parameterized tests
 * test.each([1, 2, 3])('test with value %s', (value) => {
 *   expect(typeof value).toBe('number');
 * });
 * ```
 *
 * @see SuiteState
 * @see TestDirectiveInterface
 *
 * @since 1.0.0
 */

export class TestDirective extends Function {
    /**
     * Singleton instance of the TestDirective class.
     *
     * @see TestDirectiveInterface
     * @since 1.0.0
     */

    private static instance?: TestDirective;

    /**
     * Error messages for invalid flag combinations in test configuration.
     *
     * @since 1.0.0
     */

    private static readonly ERROR_MESSAGES = {
        SKIP_ONLY: 'Cannot use "only" flag on skipped test',
        ONLY_SKIP: 'Cannot use "skip" flag on only test',
        SKIP_TODO: 'Cannot use "todo" flag on skipped test',
        SKIP_FAILING: 'Cannot use "failing" flag on skipped test'
    };

    /**
     * Default timeout in milliseconds for test execution
     * @since 1.0.0
     */

    private static readonly DEFAULT_TIMEOUT = globalThis.__XJET?.runtime.timeout ?? 5000;

    /**
     * Configuration options controlling test behavior

     * @see TestFlagsType
     * @since 1.0.0
     */

    private options: TestFlagsType = {};

    /**
     * @param invokationStack - The precise source code invocationStack where the error occurred
     */

    private invocationStack: string = '';

    /**
     * Private constructor that initializes the TestDirective instance and returns a proxied version.
     *
     * @returns A Proxy that handles direct function invocation by redirecting to the invoke method
     *
     * @remarks
     * The constructor is private to enforce the singleton pattern. It creates a Proxy
     * that allows the object to be called as a function while maintaining its object properties.
     * When called as a function, the proxy redirects the call to the invoke method.
     *
     * @internal
     * @see invoke
     *
     * @since 1.0.0
     */

    private constructor() {
        super();

        return new Proxy(this, {
            apply: (target, _, args: [string, FunctionType, number?]): void => {
                const [ description, block, timeout ] = args;
                this.invocationStack = getTrimmedStackString(2);

                target.invoke(description, block, [], timeout);
            }
        });
    }

    /**
     * Returns the singleton instance of TestDirective, creating it if it doesn't exist
     *
     * @returns The singleton instance of the test directive implementation
     *
     * @remarks
     * This method implements the singleton pattern, ensuring only one instance of the test directive exists
     * throughout the application lifecycle
     *
     * @example
     * ```ts
     * const test = TestDirective.getInstance();
     * test('my test', () => {
     *   // test implementation
     * });
     * ```
     *
     * @see TestDirectiveInterface
     *
     * @since 1.0.0
     */

    static getInstance(): TestDirectiveInterface {
        if (!TestDirective.instance) {
            TestDirective.instance = new TestDirective();
        }

        return TestDirective.instance as unknown as TestDirectiveInterface;
    }

    /**
     * Returns the singleton instance of TestDirective, creating it if it doesn't exist.
     *
     * @returns The singleton instance of TestDirective cast to TestDirectiveInterface
     *
     * @remarks
     * This method implements the Singleton pattern to ensure only one instance of
     * TestDirective exists in the application. It creates the instance on the first call
     * and returns the existing instance on subsequent calls.
     *
     * @example
     * ```ts
     * const test = TestDirective.getInstance();
     * test('example test', () => {
     *   expect(true).toBe(true);
     * });
     * ```
     *
     * @since 1.0.0
     */

    get skip(): this {
        if (this.options.only) throw new Error(TestDirective.ERROR_MESSAGES.ONLY_SKIP);
        this.options.skip = true;

        return this;
    }

    /**
     * Sets the 'only' flag for this test, making it the only test to run in its suite.
     *
     * @returns This instance with the 'only' flag set
     *
     * @throws Error - When attempting to set 'only' flag on a skipped test
     *
     * @example
     * ```ts
     * test.only('this is the only test that will run', () => {
     *   expect(true).toBe(true);
     * });
     * ```
     *
     * @see skip
     * @since 1.0.0
     */

    get only(): this {
        if (this.options.skip) throw new Error(TestDirective.ERROR_MESSAGES.SKIP_ONLY);
        this.options.only = true;

        return this;
    }

    /**
     * Marks a test as a todo item, indicating it's planned but not yet implemented
     *
     * @throws Error - When attempting to use todo flag on a skipped test
     *
     * @remarks
     * Todo tests appear in test reports to remind developers of planned work,
     * but don't execute any test code
     *
     * @example
     * ```ts
     * // Define a todo test
     * test.todo('feature that needs implementation');
     * ```
     *
     * @see TestFlagsType
     *
     * @since 1.0.0
     */

    get todo(): this {
        if (this.options.skip) throw new Error(TestDirective.ERROR_MESSAGES.SKIP_TODO);
        this.options.todo = true;

        return this;
    }

    /**
     * Marks the test as expected to fail.
     *
     * @returns This instance with the 'failing' flag set
     *
     * @throws Error - When attempting to mark a skipped test as failing
     *
     * @example
     * ```ts
     * test.failing('this test is expected to fail', () => {
     *   throw new Error('This is an expected failure');
     * });
     * ```
     *
     * @see skip
     * @since 1.0.0
     */

    get failing(): this {
        if (this.options.skip) throw new Error(TestDirective.ERROR_MESSAGES.SKIP_FAILING);
        this.options.failing = true;

        return this;
    }

    /**
     * Creates a parameterized test using template strings.
     *
     * @template T - Array type containing the values to be used in the test
     *
     * @param string - Template string array used to create the test title
     * @param placeholders - Values to be inserted into the template string
     * @returns A callback function for creating the parameterized test
     *
     * @remarks
     * The description supports parameter formatting with the following placeholders:
     * - %p - pretty-format output
     * - %s - String value
     * - %d, %i - Number as integer
     * - %f - Floating point value
     * - %j - JSON string
     * - %o - Object representation
     * - %# - Index of the test case
     * - %% - Single percent sign (doesn't consume an argument)
     *
     * Alternatively, you can inject object properties using $variable notation:
     * - $variable - Injects the property value
     * - $variable.path.to.value - Injects nested property values (works only with own properties)
     * - $# - Injects the index of the test case
     * - Note: $variable cannot be combined with printf formatting except for %%
     *
     * @example
     * ```ts
     * test.each`
     *   a    | b    | expected
     *   ${1} | ${1} | ${2}
     *   ${2} | ${2} | ${4}
     * `('returns $expected when $a is added to $b', ({a, b, expected}) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     *
     * @see each.array
     * @since 1.0.0
     */

    each<T extends ReadonlyArray<unknown>>(string: TemplateStringsArray, ...placeholders: T): TestCallbackType<Record<string, T[number]>>;

    /**
     * Creates a parameterized test using arrays of test cases.
     *
     * @template T - Type representing the test case data structure
     *
     * @param cases - Arrays containing test case values
     * @returns A callback function for creating the parameterized test
     *
     * @remarks
     * The description supports parameter formatting with the following placeholders:
     * - %p - pretty-format output
     * - %s - String value
     * - %d, %i - Number as integer
     * - %f - Floating point value
     * - %j - JSON string
     * - %o - Object representation
     * - %# - Index of the test case
     * - %% - Single percent sign (doesn't consume an argument)
     *
     * Alternatively, you can inject object properties using $variable notation:
     * - $variable - Injects the property value
     * - $variable.path.to.value - Injects nested property values (works only with own properties)
     * - $# - Injects the index of the test case
     * - Note: $variable cannot be combined with printf formatting except for %%
     *
     * @example
     * ```ts
     * test.each(
     *   [1, 1, 2],
     *   [1, 2, 3],
     *   [2, 2, 4]
     * )('adds %i + %i to equal %i', (a, b, expected) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     *
     * @see each
     * @since 1.0.0
     */

    each<T extends Array<unknown> | [unknown]>(...cases: T[]): TestCallbackType<T>; // array

    /**
     * Creates a parameterized test using individual test case objects or primitive values.
     *
     * @template T - Type representing the test case data
     *
     * @param args - Test case objects or primitive values
     * @returns A callback function for creating the parameterized test
     *
     * @remarks
     * The description supports parameter formatting with the following placeholders:
     * - %p - pretty-format output
     * - %s - String value
     * - %d, %i - Number as integer
     * - %f - Floating point value
     * - %j - JSON string
     * - %o - Object representation
     * - %# - Index of the test case
     * - %% - Single percent sign (doesn't consume an argument)
     *
     * Alternatively, you can inject object properties using $variable notation:
     * - $variable - Injects the property value
     * - $variable.path.to.value - Injects nested property values (works only with own properties)
     * - $# - Injects the index of the test case
     * - Note: $variable cannot be combined with printf formatting except for %%
     *
     * @example
     * ```ts
     * test.each(
     *   { a: 1, b: 1, expected: 2 },
     *   { a: 1, b: 2, expected: 3 },
     *   { a: 2, b: 2, expected: 4 }
     * )('adds $a + $b to equal $expected', ({ a, b, expected }) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     *
     * @see each
     * @since 1.0.0
     */

    each<T>(...args: readonly T[]): TestCallbackType<T>; // object, and primitives

    /**
     * Creates a parameterized test using arrays of primitive values as test cases.
     *
     * @template T - Array type containing the primitive test values
     *
     * @param args - Arrays of primitive values to be used as test cases
     * @returns A callback function for creating the parameterized test
     *
     * @remarks
     * The description supports parameter formatting with the following placeholders:
     * - %p - pretty-format output
     * - %s - String value
     * - %d, %i - Number as integer
     * - %f - Floating point value
     * - %j - JSON string
     * - %o - Object representation
     * - %# - Index of the test case
     * - %% - Single percent sign (doesn't consume an argument)
     *
     * Alternatively, you can inject object properties using $variable notation:
     * - $variable - Injects the property value
     * - $variable.path.to.value - Injects nested property values (works only with own properties)
     * - $# - Injects the index of the test case
     * - Note: $variable cannot be combined with printf formatting except for %%
     *
     * @example
     * ```ts
     * test.each(
     *   [1, 2, 3],
     *   [4, 5, 9],
     *   [6, 7, 13]
     * )('adds %i + %i to equal %i', (a, b, expected) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     *
     * @see each
     * @since 1.0.0
     */

    each<T extends Array<unknown>>(...args: T): TestCallbackType<T[number]>; // primitives

    /**
     * Creates a parameterized test using various input formats.
     *
     * @param args - Test case data in array format
     * @returns A callback function for creating the parameterized test
     *
     * @remarks
     * This method delegates to the implementation after binding the invoke method to the current context.
     *
     * The description supports parameter formatting with the following placeholders:
     * - %p - pretty-format output
     * - %s - String value
     * - %d, %i - Number as integer
     * - %f - Floating point value
     * - %j - JSON string
     * - %o - Object representation
     * - %# - Index of the test case
     * - %% - Single percent sign (doesn't consume an argument)
     *
     * Alternatively, you can inject object properties using $variable notation:
     * - $variable - Injects the property value
     * - $variable.path.to.value - Injects nested property values (works only with own properties)
     * - $# - Injects the index of the test case
     * - Note: $variable cannot be combined with printf formatting except for %%
     *
     * @example
     * ```ts
     * test.each(
     *   [1, 1, 2],
     *   [1, 2, 3],
     *   [2, 2, 4]
     * )('adds %i + %i to equal %i', (a, b, expected) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     *
     * @see each.table
     * @see each.array
     * @since 1.0.0
     */

    each(...args: Array<unknown>): TestCallbackType<unknown> {
        return each(this.invoke.bind(this), ...args);
    }

    /**
     * Invokes a test with the provided description, test function, arguments, and optional timeout.
     *
     * @param description - The description of the test to be displayed in test reports
     * @param block - The test function containing the test logic
     * @param args - Additional arguments to be passed to the test function
     * @param timeout - Optional timeout value in milliseconds for the test
     *
     * @throws TestNestingError - When attempting to create a nested test
     *
     * @remarks
     * This method handles the complete test registration flow, including validation,
     * creation, registration, and flag management. If no test function is provided,
     * the test will be automatically marked as todo.
     *
     * @example
     * ```ts
     * invoke('should sum two numbers', (a, b) => {
     *   expect(sum(a, b)).toBe(a + b);
     * }, [5, 10], 2000);
     * ```
     *
     * @internal
     * @since 1.0.0
     */

    invoke(description: string, block: FunctionType, args: Array<unknown> = [], timeout?: number): void {
        this.validateTestNesting(description);

        // Auto-set todo flag if no test function provided
        if (!block) {
            this.options.todo = true;
        }

        // Create and register the test
        const test = this.createTest(description, block, args, timeout);
        this.registerTest(test, this.invocationStack);

        // Reset options after test creation
        this.resetFlags();
    }

    /**
     * Validates that tests are not being nested inside other tests.
     *
     * @param description - The description of the test being validated
     *
     * @throws Error - When a test is nested inside another test, with details about both tests
     *
     * @remarks
     * Nesting tests is not supported in the testing framework as it can lead to unpredictable behavior
     * and difficult-to-debug test scenarios.
     *
     * @internal
     * @since 1.0.0
     */

    private validateTestNesting(description: string): void {
        const runningTest = inject(SuiteState).test;
        if (runningTest) {
            // set invokation
            throw new Error(`Cannot nest a test inside a test '${ description }' in '${ runningTest.description }'`);
        }
    }

    /**
     * Creates a new TestModel with the current configuration
     */
    private createTest(description: string, block: FunctionType, args: Array<unknown>, timeout?: number): TestModel {
        return new TestModel(
            description,
            block,
            timeout ?? TestDirective.DEFAULT_TIMEOUT,
            args,
            { ...this.options } // Clone options to prevent shared references
        );
    }

    /**
     * Registers a test with the test suite and sets its execution invocationStack.
     *
     * @param test - The test model to register
     * @param location - The precise source code invocationStack where the error occurred
     *
     * @remarks
     * This method determines the invocationStack where the test was invoked in the source code
     * and attaches that information to the test before adding it to the suite state.
     * Location information is useful for error reporting and test navigation.
     *
     * @internal
     * @since 1.0.0
     */

    private registerTest(test: TestModel, location: string): void {
        if (location) {
            test.setExecutionLocation(location);
        }
        inject(SuiteState).addTest(test);
    }

    /**
     * Resets all test configuration options to their default state.
     *
     * @returns Nothing
     *
     * @remarks
     * This method clears all previously set options to ensure that configuration
     * from one test doesn't leak into subsequent tests.
     *
     * @internal
     * @since 1.0.0
     */

    private resetFlags(): void {
        this.options = {};
    }
}
