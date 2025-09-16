/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';
import type { CallbackHandlerType, DoneCallbackType } from '@shared/models/interfaces/hook-model.interface';

/**
 * Represents a test callback function that registers a named test with arguments and optional done callback
 *
 * @template T - The type of arguments passed to the test function
 *
 * @param name - The descriptive name of the test
 * @param fn - The test implementation function that either accepts arguments and a done callback, or returns a Promise
 * @returns A void function that registers the test in the testing framework
 *
 * @example
 * ```ts
 * const testEach: TestCallbackType<{value: number}> = (name, fn) => {
 *   test(`Test ${name}`, (done) => {
 *     fn({value: 42}, done);
 *   });
 * };
 * ```
 *
 * @see TestDirectiveInterface - The interface that utilizes this callback type
 * @since 1.0.0
 */

export type TestCallbackType<T> = (
    name: string, fn: (args: T, done: DoneCallbackType) => void | ((args: T) => Promise<void>)
) => void;

export interface TestDirectiveInterface {
    /**
     * Registers a test case with the given name and optional callback function
     *
     * @param name - The descriptive name of the test case
     * @param fn - The callback function containing the test implementation
     * @param timeout - The maximum time in milliseconds the test is allowed to run before timing out
     * @returns Nothing
     *
     * @example
     * ```ts
     * test('should validate user input', () => {
     *   const result = validateInput('test@example.com');
     *   expect(result).toBe(true);
     * });
     *
     * test('should handle async operations', async () => {
     *   const data = await fetchUserData(1);
     *   expect(data.name).toBe('John');
     * }, 5000);
     * ```
     *
     * @see CallbackHandlerType - The type definition for the test callback function
     * @since 1.0.0
     */

    (name: string, fn?: CallbackHandlerType, timeout?: number): void;

    /**
     * Creates a skipped test that will be recognized but not executed during test runs
     *
     * @override
     * @returns The same TestDirectiveInterface instance with skip flag enabled, allowing for method chaining
     * @throws Error - When attempting to combine with 'only' flag which would create conflicting test behavior
     *
     * @remarks
     * When applied, the test will be marked as skipped in test reports but won't be executed.
     * Cannot be combined with the 'only' modifier due to conflicting behavior.
     *
     * @example
     * ```ts
     * test.skip('temporarily disabled test', () => {
     *   expect(result).toBe(true);
     * });
     * ```
     *
     * @see TestDirectiveInterface
     * @since 1.0.0
     */

    get skip(): TestDirectiveInterface;

    /**
     * Creates an exclusive test that will run while other non-exclusive tests are skipped
     *
     * @override
     * @returns The same TestDirectiveInterface instance with only flag enabled, allowing for method chaining
     * @throws Error - When attempting to combine with 'skip' flag which would create conflicting test behavior
     *
     * @remarks
     * When applied, only this test and other tests marked with 'only' will be executed.
     * This is useful for focusing on specific tests during development or debugging.
     * Cannot be combined with the 'skip' modifier due to conflicting behavior.
     *
     * @example
     * ```ts
     * test.only('focus on this test', () => {
     *   const result = performOperation();
     *   expect(result).toBe(expectedValue);
     * });
     * ```
     *
     * @see TestDirectiveInterface
     * @since 1.0.0
     */

    get only(): TestDirectiveInterface;

    /**
     * Marks a test as planned but not yet implemented or currently incomplete
     *
     * @override
     * @returns The same TestDirectiveInterface instance with todo flag enabled, allowing for method chaining
     * @throws Error - When attempting to combine with 'skip' flag which would create redundant test configuration
     *
     * @remarks
     * Tests marked as todo will be reported in test results as pending or incomplete.
     * This is useful for planning test cases before implementing them or for documenting
     * tests that need to be written in the future.
     *
     * @example
     * ```ts
     * test.todo('implement validation test for email addresses');
     *
     * // Or with empty implementation
     * test.todo('handle error cases', () => {
     *   // To be implemented
     * });
     * ```
     *
     * @see TestDirectiveInterface
     * @since 1.0.0
     */

    get todo(): TestDirectiveInterface;

    /**
     * Marks a test that is expected to fail, allowing tests to be committed even with known failures
     *
     * @override
     * @returns The same TestDirectiveInterface instance with failing flag enabled, allowing for method chaining
     * @throws Error - When attempting to combine with incompatible directives that would create ambiguous test behavior
     *
     * @remarks
     * The failing directive is useful when you want to document a bug that currently makes a test fail.
     * Tests marked as failing will be reported as passed when they fail, and failed when they pass.
     * This helps maintain test suites that contain tests for known issues or bugs that haven't been fixed yet.
     *
     * @example
     * ```ts
     * test.failing('this bug is not fixed yet', () => {
     *   const result = buggyFunction();
     *   expect(result).toBe(expectedValue); // This will fail as expected
     * });
     * ```
     *
     * @see TestDirectiveInterface
     * @since 1.0.0
     */

    get failing(): TestDirectiveInterface;

    /**
     * Creates a parameterized test suite with table data defined using template literals
     *
     * @template T - Array type containing the values for parameterized tests
     * @param string - Template strings array containing the table header and row structure
     * @param placeholders - Values to be inserted into the template strings to form the test data table
     * @returns A function that accepts a title template and callback to define the test suite
     * @throws Error - When the template format is invalid or doesn't match the provided values
     *
     * @remarks
     * This method allows creating data-driven tests with a table-like syntax using template literals.
     * Each row in the provided table represents a separate test case with different inputs.
     * The values from each row will be mapped to named parameters in the test callback.
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
     * test.each`
     *   a    | b    | expected
     *   ${1} | ${1} | ${2}
     *   ${2} | ${2} | ${4}
     *   ${3} | ${3} | ${6}
     * `('$a + $b should be $expected', ({a, b, expected}) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     * @see each
     * @see TestCallbackType
     *
     * @since 1.0.0
     */

    each<T extends ReadonlyArray<unknown>>(string: TemplateStringsArray, ...placeholders: T): TestCallbackType<Record<string, T[number]>>;

    /**
     * Creates a parameterized test suite with an array of test cases
     *
     * @template T - Array type representing the structure of each test case
     * @param cases - One or more test cases, where each case is an array of values
     * @returns A function that accepts a title template and callback to define the test suite
     * @throws Error - When invalid test cases are provided or parameter count doesn't match the callback
     *
     * @remarks
     * This method allows creating data-driven tests by providing an array of test cases.
     * Each case array represents a separate test run with different parameters.
     * The values from each array will be passed as arguments to the test callback function.
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
     *   [2, 2, 4],
     *   [3, 3, 6]
     * )('adds %i + %i to equal %i', (a, b, expected) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     * @see each
     * @see TestCallbackType
     *
     * @since 1.0.0
     */

    each<T extends Array<unknown> | [unknown]>(...cases: T[]): TestCallbackType<T>;

    /**
     * Creates a parameterized test suite with an array of generic test cases
     *
     * @template T - Type representing the structure of each test case
     * @param args - One or more test cases of type T to be used as parameters
     * @returns A function that accepts a title template and callback to define the test suite
     * @throws Error - When invalid test cases are provided or parameter format doesn't match the callback expectations
     *
     * @remarks
     * This method provides a flexible way to create data-driven tests using a variety of case types.
     * The test callback will be executed once for each provided test case.
     * Parameter values from each case will be passed to the test callback function.
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
     * // Using objects as test cases
     * test.each(
     *   { a: 1, b: 1, expected: 2 },
     *   { a: 2, b: 2, expected: 4 },
     *   { a: 3, b: 3, expected: 6 }
     * )('adds $a + $b to equal $expected', ({a, b, expected}) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     *
     * @see each
     * @see TestCallbackType
     * @since 1.0.0
     */

    each<T>(...args: readonly T[]): TestCallbackType<T>;

    /**
     * Creates a parameterized test suite by spreading an array of test cases
     *
     * @template T - Array type containing the individual test cases
     * @param args - Individual test cases spread from an array
     * @returns A function that accepts a title template and callback to define the test suite
     * @throws Error - When invalid test cases are provided or case format is incompatible with the test callback
     *
     * @remarks
     * This method enables data-driven testing by spreading an array of test cases into individual parameters.
     * Each element in the array represents a separate test case that will be executed individually.
     * The test callback will be invoked once for each test case in the array.
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
     * const testCases = [
     *   [1, 1, 2],
     *   [2, 2, 4],
     *   [3, 3, 6]
     * ];
     *
     * test.each(...testCases)('adds %i + %i to equal %i', (a, b, expected) => {
     *   expect(a + b).toBe(expected);
     * });
     * ```
     * @see each
     * @see TestCallbackType
     *
     * @since 1.0.0
     */

    each<T extends Array<unknown>>(...args: T): TestCallbackType<T[number]>;

    /**
     * Executes a function block as a test case with the specified description
     *
     * @param description - Human-readable description of what this test case is verifying
     * @param block - Function to be executed as the test case implementation
     * @param args - Optional array of arguments to pass to the test function
     * @param timeout - Optional timeout in milliseconds for this specific test case
     * @returns void
     * @throws Error - When the test function throws an exception or an assertion fails
     *
     * @remarks
     * This method provides a way to directly invoke a test function with optional arguments.
     * It registers the test with the test runner and executes it during the test run phase.
     * The provided description will be used for test reporting and identification.
     *
     * @example
     * ```ts
     * test.invoke('should add two numbers correctly', (a, b) => {
     *   expect(a + b).toBe(3);
     * }, [1, 2], 1000);
     * ```
     *
     * @see FunctionType
     * @since 1.0.0
     */

    invoke(description: string, block: FunctionType, args?: Array<unknown>, timeout?: number): void;
}

