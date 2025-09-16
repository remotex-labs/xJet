/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';

/**
 * Represents a callback function type used for parameterized test suite definitions.
 *
 * @template T - The type of arguments passed to the test function
 *
 * @param name - The title of the describe block, which can include parameter placeholders
 * @param fn - The function containing the tests to be run, which receives the test parameters
 *
 * @returns void
 *
 * @remarks
 * This type definition is used for creating parameterized test suites where test data
 * is passed to the test function. The name parameter supports various placeholder formats
 * to incorporate test data into the test suite title.
 *
 * @since 1.0.0
 */

export type DescribeCallbackType<T> = (name: string, fn: (args: T) => void) => void;

/**
 * Interface defining the describe directive functionality for test organization.
 *
 * The describe directive creates a block that groups together related tests.
 * It serves as the primary organizational structure for test suites, allowing
 * developers to group related test cases and create a hierarchy of test blocks.
 *
 * @template T - The type parameter for the describe directive
 *
 * @remarks
 * Describe blocks can be nested within each other to create logical groupings of tests.
 * They can also have before/after hooks attached to them for setup and teardown code.
 *
 * @example
 * ```ts
 * describe('Calculator', () => {
 *   describe('add method', () => {
 *     test('adds two positive numbers', () => {
 *       expect(calculator.add(1, 2)).toBe(3);
 *     });
 *
 *     test('adds a positive and negative number', () => {
 *       expect(calculator.add(1, -2)).toBe(-1);
 *     });
 *   });
 * });
 * ```
 *
 * @see TestCase
 * @see TestDirectiveInterface
 *
 * @since 1.0.0
 */

export interface DescribeDirectiveInterface {
    /**
     * Executes a test suite block with the given name and test function.
     *
     * @param name - The title of the test suite
     * @param fn - The function containing the tests to be run within this suite
     *
     * @returns void
     *
     * @example
     * ```ts
     * describe('User authentication', () => {
     *   test('should log in with valid credentials', () => {
     *     // Test implementation
     *     expect(login('user', 'password')).toBe(true);
     *   });
     *
     *   test('should fail with invalid credentials', () => {
     *     // Test implementation
     *     expect(login('user', 'wrong')).toBe(false);
     *   });
     * });
     * ```
     *
     * @since 1.0.0
     */


    (name: string, fn: () => void): void;

    /**
     * Marks this describe to be skipped during test execution.
     *
     * @returns this - The current instance for method chaining
     *
     * @example
     * ```ts
     * describe.skip('Features under development', () => {
     *   test('new feature', () => {
     *     // This test will be skipped
     *   });
     * });
     * ```
     *
     * @since 1.0.0
     */

    get skip(): this;

    /**
     * Marks this test suite to be the only one executed in the current context.
     *
     * @returns this - The current instance for method chaining
     *
     * @example
     * ```ts
     * describe.only('Critical functionality', () => {
     *   test('core feature', () => {
     *     // Only this suite will run
     *   });
     * });
     * ```
     *
     * @since 1.0.0
     */

    get only(): this;

    /**
     * Creates parameterized test suites using template literals with placeholders.
     *
     * @template T - Array type representing the test case data
     *
     * @param string - Template string with placeholders for test data
     * @param placeholders - Values to be substituted into the template string placeholders
     *
     * @returns A callback function that accepts a test name pattern and implementation function
     *
     * @remarks
     * The name parameter can include formatters:
     * - Generate unique test titles by positionally injecting parameters with printf formatting:
     *   - %p - pretty-format
     *   - %s - String
     *   - %d - Number
     *   - %i - Integer
     *   - %f - Floating point value
     *   - %j - JSON
     *   - %o - Object
     *   - %# - Index of the test case
     *   - %% - Single percent sign ('%'). This does not consume an argument
     * - Or generate unique test titles by injecting properties of test case object with $variable:
     *   - To inject nested object values supply a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *   - Use $# to inject the index of the test case
     *   - You cannot use $variable with printf formatting except for %%
     *
     * The fn parameter is the function that will receive the parameters in each row as function arguments.
     * Optionally, you can provide a timeout (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.
     *
     * @example
     * ```ts
     * describe.each`
     *   a    | b    | expected
     *   ${1} | ${1} | ${2}
     *   ${2} | ${3} | ${5}
     * `('$a + $b = $expected', ({ a, b, expected }) => {
     *   test('adds correctly', () => {
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
     * @template T - Type representing arrays of test cases
     *
     * @param cases - Arrays containing the test case data
     *
     * @returns A callback function that accepts a test name pattern and implementation function
     *
     * @remarks
     * The name parameter can include formatters:
     * - Generate unique test titles by positionally injecting parameters with printf formatting:
     *   - %p - pretty-format
     *   - %s - String
     *   - %d - Number
     *   - %i - Integer
     *   - %f - Floating point value
     *   - %j - JSON
     *   - %o - Object
     *   - %# - Index of the test case
     *   - %% - Single percent sign ('%'). This does not consume an argument
     * - Or generate unique test titles by injecting properties of test case object with $variable:
     *   - To inject nested object values supply a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *   - Use $# to inject the index of the test case
     *   - You cannot use $variable with printf formatting except for %%
     *
     * The fn parameter is the function that will receive the parameters in each row as function arguments.
     * Optionally, you can provide a timeout (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.
     *
     * @example
     * ```ts
     * describe.each([
     *   [1, 1, 2],
     *   [2, 3, 5]
     * ])('add(%i, %i) = %i', (a, b, expected) => {
     *   test('adds correctly', () => {
     *     expect(a + b).toBe(expected);
     *   });
     * });
     * ```
     *
     * @see DescribeCallbackType
     * @since 1.0.0
     */

    each<T extends Array<unknown> | [unknown]>(...cases: T[]): DescribeCallbackType<T>;

    /**
     * Creates parameterized test suites from individual test case values.
     *
     * @template T - Type representing the test case data
     *
     * @param args - Individual test case values
     *
     * @returns A callback function that accepts a test name pattern and implementation function
     *
     * @remarks
     * The name parameter can include formatters:
     * - Generate unique test titles by positionally injecting parameters with printf formatting:
     *   - %p - pretty-format
     *   - %s - String
     *   - %d - Number
     *   - %i - Integer
     *   - %f - Floating point value
     *   - %j - JSON
     *   - %o - Object
     *   - %# - Index of the test case
     *   - %% - Single percent sign ('%'). This does not consume an argument
     * - Or generate unique test titles by injecting properties of test case object with $variable:
     *   - To inject nested object values supply a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *   - Use $# to inject the index of the test case
     *   - You cannot use $variable with printf formatting except for %%
     *
     * The fn parameter is the function that will receive the parameters in each row as function arguments.
     * Optionally, you can provide a timeout (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.
     *
     * @example
     * ```ts
     * describe.each(
     *   { name: 'John', age: 30 },
     *   { name: 'Jane', age: 25 }
     * )('Testing $name', (person) => {
     *   test('age check', () => {
     *     expect(person.age).toBeGreaterThan(18);
     *   });
     * });
     * ```
     *
     * @see DescribeCallbackType
     * @since 1.0.0
     */

    each<T>(...args: readonly T[]): DescribeCallbackType<T>;

    /**
     * Creates parameterized test suites from individual objects or primitive values.
     *
     * @template T - Array type representing the test case data
     *
     * @param args - Individual test case values in an array
     *
     * @returns A callback function that accepts a test name pattern and implementation function
     *
     * @remarks
     * The name parameter can include formatters:
     * - Generate unique test titles by positionally injecting parameters with printf formatting:
     *   - %p - pretty-format
     *   - %s - String
     *   - %d - Number
     *   - %i - Integer
     *   - %f - Floating point value
     *   - %j - JSON
     *   - %o - Object
     *   - %# - Index of the test case
     *   - %% - Single percent sign ('%'). This does not consume an argument
     * - Or generate unique test titles by injecting properties of test case object with $variable:
     *   - To inject nested object values supply a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *   - Use $# to inject the index of the test case
     *   - You cannot use $variable with printf formatting except for %%
     *
     * The fn parameter is the function that will receive the parameters in each row as function arguments.
     * Optionally, you can provide a timeout (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.
     *
     * @example
     * ```ts
     * describe.each(
     *   1, 2, 3, 4
     * )('Testing with value %i', (value) => {
     *   test('is positive', () => {
     *     expect(value).toBeGreaterThan(0);
     *   });
     * });
     * ```
     *
     * @see DescribeCallbackType
     *
     * @since 1.0.0
     */

    each<T extends Array<unknown>>(...args: T): DescribeCallbackType<T[number]>;

    /**
     * Invokes a test block with the specified description and function.
     *
     * @param description - String for the title of the test block
     * @param block - Function that contains the test logic to be executed
     * @param args - Optional array of arguments to pass to the test function
     *
     * @remarks
     * The description parameter can include formatters:
     * - Generate unique test titles by positionally injecting parameters with printf formatting:
     *   - %p - pretty-format
     *   - %s - String
     *   - %d - Number
     *   - %i - Integer
     *   - %f - Floating point value
     *   - %j - JSON
     *   - %o - Object
     *   - %# - Index of the test case
     *   - %% - Single percent sign ('%'). This does not consume an argument
     * - Or generate unique test titles by injecting properties of test case object with $variable:
     *   - To inject nested object values supply a keyPath i.e. $variable.path.to.value (only works for "own" properties)
     *   - Use $# to inject the index of the test case
     *   - You cannot use $variable with printf formatting except for %%
     *
     * The block parameter is the function that will receive the parameters in each row as function arguments.
     * Optionally, you can provide a timeout (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.
     *
     * @returns void
     */

    invoke(description: string, block: FunctionType, args?: Array<unknown>): void;
}
