/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';
import type { DescribeOptionsInterface } from '@shared/models/interfaces/describe-model.interface';
import type { DescribeCallbackType } from '@shared/directives/interfaces/describe-directive.interface';
import type { DescribeDirectiveInterface } from '@shared/directives/interfaces/describe-directive.interface';

/**
 * Imports
 */

import { SuiteState } from '@shared/states/suite.state';
import { each } from '@shared/directives/each.directive';
import { inject } from '@symlinks/services/inject.service';

/**
 * Implementation of the describe directive that allows for test suite definition with chainable modifiers.
 * Acts as a function that can be invoked directly while also providing chainable property access.
 *
 * @param description - The test suite description
 * @param block - The test suite implementation function
 *
 * @throws Error - When attempting to nest describe blocks inside tests
 * @throws Error - When using incompatible flag combinations (e.g., skip with only)
 *
 * @remarks
 * This class extends Function to allow it to be invoked as a function while also
 * providing methods and properties. It uses a Proxy to capture function invocations
 * and redirects them to the invoke method.
 *
 * The describe directive creates a group of related tests, providing organization and structure
 * to test suites. It supports chainable modifiers for customizing test suite behavior,
 * and parameterized testing via the 'each' method.
 *
 * @example
 * ```ts
 * // Basic describe block
 * describe('Calculator', () => {
 *   test('should add numbers', () => {
 *     expect(2 + 2).toBe(4);
 *   });
 * });
 *
 * // With modifiers
 * describe.only('Priority feature', () => {
 *   test('important test case', () => {
 *     expect(true).toBe(true);
 *   });
 * });
 *
 * // With parameterized tests using each
 * describe.each([1, 2, 3])('Math operations for %s', (value) => {
 *   test('square', () => {
 *     expect(value * value).toBeGreaterThan(0);
 *   });
 * });
 * ```
 *
 * @see SuiteState
 * @see DescribeDirectiveInterface
 *
 * @since 1.0.0
 */

export class DescribeDirective extends Function {
    /**
     * Singleton instance of the DescribeDirective class.
     *
     * @see DescribeDirectiveInterface
     * @since 1.0.0
     */

    private static instance: DescribeDirectiveInterface | null = null;

    /**
     * Configuration options controlling test suite behavior
     *
     * @see DescribeOptionsInterface
     * @since 1.0.0
     */

    private options: DescribeOptionsInterface = {};

    /**
     * Private constructor that initializes the DescribeDirective instance and returns a proxied version.
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

        return <this>new Proxy(this, {
            apply(target, thisArg, args: [ string, FunctionType ]): void {
                target.invoke(args[0], args[1]);
            }
        });
    }

    /**
     * Returns the singleton instance of DescribeDirective, creating it if it doesn't exist
     *
     * @returns The singleton instance of the describe directive implementation
     *
     * @remarks
     * This method implements the singleton pattern, ensuring only one instance of the describe directive
     * exists throughout the application lifecycle.
     *
     * @see DescribeDirectiveInterface
     * @since 1.0.0
     */

    static getInstance(): DescribeDirectiveInterface {
        if (!DescribeDirective.instance) {
            DescribeDirective.instance = <DescribeDirectiveInterface><unknown>new DescribeDirective();
        }

        return DescribeDirective.instance;
    }

    /**
     * Creates a skipped test suite that will be recognized but not executed during test runs
     *
     * @returns The same DescribeDirective instance with skip flag enabled, allowing for method chaining
     * @throws Error - When attempting to combine with 'only' flag which would create conflicting behavior
     *
     * @remarks
     * When applied, the test suite will be marked as skipped in test reports but won't be executed.
     * Cannot be combined with the 'only' modifier due to conflicting behavior.
     *
     * @example
     * ```ts
     * describe.skip('temporarily disabled suite', () => {
     *   test('will not run', () => {
     *     expect(result).toBe(true);
     *   });
     * });
     * ```
     *
     * @see DescribeDirectiveInterface
     * @since 1.0.0
     */

    get skip(): this {
        if (this.options.only) throw new Error('Cannot use "skip" flag on only test');
        this.options.skip = true;

        return this;
    }

    /**
     * Creates an exclusive test suite that will run while other non-exclusive suites are skipped
     *
     * @returns The same DescribeDirective instance with only flag enabled, allowing for method chaining
     * @throws Error - When attempting to combine with 'skip' flag which would create conflicting behavior
     *
     * @remarks
     * When applied, only this test suite and other suites marked with 'only' will be executed.
     * This is useful for focusing on specific test suites during development or debugging.
     * Cannot be combined with the 'skip' modifier due to conflicting behavior.
     *
     * @example
     * ```ts
     * describe.only('focus on this suite', () => {
     *   test('will run', () => {
     *     expect(result).toBe(expectedValue);
     *   });
     * });
     * ```
     *
     * @see DescribeDirectiveInterface
     * @since 1.0.0
     */

    get only(): this {
        if (this.options.skip) throw new Error('Cannot use "only" flag on skipped test');
        this.options.only = true;

        return this;
    }

    /**
     * Generates parameterized test suites from template strings and placeholders.
     *
     * @template T - An array type extending ReadonlyArray<unknown> that contains the placeholder values
     *
     * @param string - A template string array that defines the structure of test suite descriptions
     * @param placeholders - Values to be inserted into the template strings to create test suites
     *
     * @returns A callback function compatible with Jest's describe method that provides parameterized test data
     *
     * @throws TypeError - When the number of placeholders doesn't match the template string requirements
     *
     * @remarks
     * This method uses tagged template literals to create parameterized test suites.
     * The values provided as placeholders will be passed to describe callbacks as named parameters.
     *
     * The returned function accepts the following parameters:
     * - name: String - The title of the describe block.
     *   Generate unique describe titles by positionally injecting parameters with printf formatting:
     *     %p - pretty-format.
     *     %s - String.
     *     %d - Number.
     *     %i - Integer.
     *     %f - Floating point value.
     *     %j - JSON.
     *     %o - Object.
     *     %# - Index of the test suite.
     *     %% - single percent sign ('%'). This does not consume an argument.
     *   Or generate unique describe titles by injecting properties of test suite object with $variable:
     *     - To inject nested object values use a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *     - You can use $# to inject the index of the test suite
     *     - You cannot use $variable with the printf formatting except for %%
     * - fn: Function - The describe callback to be run, this is the function that will receive the parameters in each row as function arguments.
     * - timeout (optional): Number - Time in milliseconds to wait for each row before aborting. Default is 5 seconds.
     *
     * @example
     * ```ts
     * describe.each`
     *   a    | b    | expected
     *   ${1} | ${1} | ${2}
     *   ${1} | ${2} | ${3}
     *   ${2} | ${2} | ${4}
     * `('addition: $a + $b = $expected', ({a, b, expected}) => {
     *   test('equals expected value', () => {
     *     expect(a + b).toBe(expected);
     *   });
     * });
     * ```
     *
     * @see DescribeCallbackType
     * @since 1.0.0
     */

    each<T extends ReadonlyArray<unknown>>(string: TemplateStringsArray, ...placeholders: T): DescribeCallbackType<Record<string, T[number]>>;

    /**
     * Creates parameterized test suites from arrays of test case values.
     *
     * @template T - A type extending Array<unknown> or [unknown] that contains the test case values
     *
     * @param cases - Arrays of values representing individual test cases
     *
     * @returns A callback function compatible with Jest's describe method that provides parameterized test data
     *
     * @throws TypeError - When the test cases have inconsistent formats or types
     *
     * @remarks
     * This method allows creating parameterized test suites from arrays of values.
     * Each array provided as a case will be passed to the describe callback as separate arguments.
     *
     * The returned function accepts the following parameters:
     * - name: String - The title of the describe block.
     *   Generate unique describe titles by positionally injecting parameters with printf formatting:
     *     %p - pretty-format.
     *     %s - String.
     *     %d - Number.
     *     %i - Integer.
     *     %f - Floating point value.
     *     %j - JSON.
     *     %o - Object.
     *     %# - Index of the test suite.
     *     %% - single percent sign ('%'). This does not consume an argument.
     *   Or generate unique describe titles by injecting properties of test suite object with $variable:
     *     - To inject nested object values use a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *     - You can use $# to inject the index of the test suite
     *     - You cannot use $variable with the printf formatting except for %%
     * - fn: Function - The describe callback to be run, this is the function that will receive the parameters in each row as function arguments.
     * - timeout (optional): Number - Time in milliseconds to wait for each row before aborting. Default is 5 seconds.
     *
     * @example
     * ```ts
     * describe.each(
     *   [1, 1, 2],
     *   [1, 2, 3],
     *   [2, 2, 4]
     * )('addition: %d + %d = %d', (a, b, expected) => {
     *   test('equals expected value', () => {
     *     expect(a + b).toBe(expected);
     *   });
     * });
     * ```
     *
     * @see DescribeCallbackType
     * @since 1.0.0
     */

    each<T extends Array<unknown> | [ unknown ]>(...cases: T[]): DescribeCallbackType<T>; // array

    /**
     * Creates parameterized test suites from individual test case values.
     *
     * @template T - The type of test case values (objects or primitives)
     *
     * @param args - Individual test case values to be used in the test suites
     *
     * @returns A callback function compatible with Jest's describe method that provides parameterized test data
     *
     * @throws TypeError - When the test cases have incompatible types
     *
     * @remarks
     * This method allows creating parameterized test suites from individual values.
     * Each value provided as an argument will be passed to the describe callback.
     * This overload is particularly useful for objects and primitive values.
     *
     * The returned function accepts the following parameters:
     * - name: String - The title of the describe block.
     *   Generate unique describe titles by positionally injecting parameters with printf formatting:
     *     %p - pretty-format.
     *     %s - String.
     *     %d - Number.
     *     %i - Integer.
     *     %f - Floating point value.
     *     %j - JSON.
     *     %o - Object.
     *     %# - Index of the test suite.
     *     %% - single percent sign ('%'). This does not consume an argument.
     *   Or generate unique describe titles by injecting properties of test suite object with $variable:
     *     - To inject nested object values use a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *     - You can use $# to inject the index of the test suite
     *     - You cannot use $variable with the printf formatting except for %%
     * - fn: Function - The describe callback to be run, this is the function that will receive the test case value as an argument.
     * - timeout (optional): Number - Time in milliseconds to wait for each test case before aborting. Default is 5 seconds.
     *
     * @example
     * ```ts
     * describe.each(
     *   { a: 1, b: 1, expected: 2 },
     *   { a: 1, b: 2, expected: 3 },
     *   { a: 2, b: 2, expected: 4 }
     * )('addition: $a + $b = $expected', ({ a, b, expected }) => {
     *   test('equals expected value', () => {
     *     expect(a + b).toBe(expected);
     *   });
     * });
     * ```
     *
     * @see DescribeCallbackType
     * @since 1.0.0
     */

    each<T>(...args: readonly T[]): DescribeCallbackType<T>; // object, and primitives

    /**
     * Creates parameterized test suites from individual objects or primitive values.
     *
     * @template T - The type of test case values
     *
     * @param args - Individual objects or primitive values to be used as test cases
     *
     * @returns A callback function compatible with Jest's describe method
     *
     * @remarks
     * This method creates parameterized test suites where each argument represents a complete test case.
     * Useful for testing with objects or primitive values that each represent a single test scenario.
     *
     * The returned function accepts the following parameters:
     * - name: String - The title of the describe block.
     *   Generate unique describe titles by positionally injecting parameters with printf formatting:
     *     %p - pretty-format.
     *     %s - String.
     *     %d - Number.
     *     %i - Integer.
     *     %f - Floating point value.
     *     %j - JSON.
     *     %o - Object.
     *     %# - Index of the test suite.
     *     %% - single percent sign ('%'). This does not consume an argument.
     *   Or generate unique describe titles by injecting properties of test suite object with $variable:
     *     - To inject nested object values use a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *     - You can use $# to inject the index of the test suite
     *     - You cannot use $variable with the printf formatting except for %%
     * - fn: Function - The describe callback to be run, this is the function that will receive the test case value as an argument.
     * - timeout (optional): Number - Time in milliseconds to wait for each test case before aborting. Default is 5 seconds.
     *
     * @example
     * ```ts
     * describe.each(
     *   { input: 'hello', expected: 'HELLO' },
     *   { input: 'world', expected: 'WORLD' }
     * )('toUpperCase($input) → $expected', (testCase) => {
     *   test('converts correctly', () => {
     *     expect(testCase.input.toUpperCase()).toBe(testCase.expected);
     *   });
     * });
     * ```
     *
     * @see DescribeCallbackType
     * @since 1.0.0
     */

    each<T extends Array<unknown>>(...args: T): DescribeCallbackType<T[number]>; // primitives

    /**
     * Creates parameterized test suites by delegating to the external 'each' function.
     *
     * @param args - Test case values to be used in the parameterized test suites
     *
     * @returns A callback function compatible with Jest's describe method
     *
     * @remarks
     * This method serves as a bridge between the describe context and the external 'each' utility.
     * It binds the current context's 'invoke' method and passes it along with the test cases
     * to the external 'each' function, which handles the creation of parameterized test suites.
     *
     * The returned function has the same behavior as the one returned by the external 'each' function,
     * but ensures that tests are executed within the proper describe context.
     *
     * The returned function accepts the following parameters:
     * - name: String - The title of the describe block, which can include parameter placeholders
     * - fn: Function - The describe callback function that will receive the test case values
     * - timeout (optional): Number - Time in milliseconds before test timeout
     *
     * @example
     * ```ts
     * // Internal implementation used when calling describe.each
     * // Users don't directly call this method, but rather use:
     * describe.each([1, 2, 3])('test with %d', (num) => {
     *   test('works with ' + num, () => {
     *     expect(num).toBeDefined();
     *   });
     * });
     * ```
     *
     * @internal
     * @since 1.0.0
     */

    each(...args: Array<unknown>): DescribeCallbackType<unknown> {
        return each(this.invoke.bind(this), ...args);
    }

    /**
     * Executes a describe block with the given description and function.
     *
     * @param description - The title of the describe block
     * @param block - The function containing the tests to be run within this describe block
     * @param args - Optional array of arguments to pass to the block function
     *
     * @throws Error - When attempting to nest a describe block inside a test
     *
     * @remarks
     * This method is the core implementation for creating test suites in the testing framework.
     * It registers a describe block with the suite state manager and applies any options
     * that were set on the describe object before this method was called.
     *
     * This method is primarily called internally by the testing framework and
     * typically not meant to be called directly by users.
     *
     * @example
     * ```ts
     * // Internal implementation example - not for direct use
     * const describeObj = new Describe();
     * describeObj.invoke('My test suite', () => {
     *   // Test implementations
     * });
     * ```
     *
     * @internal
     * @since 1.0.0
     */

    invoke(description: string, block: FunctionType, args: Array<unknown> = []): void {
        const suiteState = inject(SuiteState);
        const runningTest = suiteState.test;

        if (runningTest) {
            throw new Error(
                `Cannot nest a describe inside a test '${ description }' in '${ runningTest.description }'`
            );
        }

        suiteState.addDescribe(description, block, this.options, args);
        // Reset options after use
        this.options = {};
    }
}
