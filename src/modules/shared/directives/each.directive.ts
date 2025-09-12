/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';
import type { InvokeType } from '@shared/directives/interfaces/each-directive.interface';

/**
 * Imports
 */

import { printf } from '@shared/components/printf.component';

/**
 * Converts a template string and input data into an array of structured objects
 *
 * @param templateString - Template string containing column headings separated by pipe characters
 * @param inputData - Array of values to be organized according to the template structure
 * @returns Array of objects where each object represents a row with properties named after the headings
 *
 * @throws Error - When template headings are empty or missing pipe delimiters
 * @throws Error - When the input data length is not a multiple of the headings length
 *
 * @example
 * ```ts
 * const template = parseTemplate(`name|age|role`, ['John', 30, 'Developer', 'Jane', 25, 'Designer']);
 * // Returns: [
 * //   { name: 'John', age: 30, role: 'Developer' },
 * //   { name: 'Jane', age: 25, role: 'Designer' }
 * // ]
 * ```
 *
 * @see each - Function that uses parseTemplate for test case generation
 *
 * @since 1.0.0
 */

export function parseTemplate(templateString: TemplateStringsArray, inputData: Array<unknown>): Array<Record<string, unknown>> {
    // Extract the column headings and remove any leading/trailing whitespace
    const headings: string[] = templateString[0].split('|').map((h: string) => h.trim());
    if (headings.length === 0 || headings.some((h) => h === ''))
        throw new Error('Template string headings must not be empty and should contain pipe delimiters.');

    if ((inputData.length % headings.length) !== 0)
        throw new Error('Not enough arguments supplied for given headings.');

    return Array.from({ length: inputData.length / headings.length }, (_, rowIndex) => {
        return headings.reduce((acc, heading, columnIndex) => {
            acc[heading] = inputData[rowIndex * headings.length + columnIndex];

            return acc;
        }, {} as Record<string, unknown>);
    });
}

/**
 * Executes a function block as a test case with the specified description
 *
 * @template T - Type extending Array of unknown values
 * @param executor - The function that will execute each test case
 * @param args - Arguments representing test cases or a tagged template literal
 * @returns A function that accepts a test name, test block function, and optional timeout
 *
 * @throws Error - When called with fewer than 2 arguments
 *
 * @remarks
 * This method provides a way to directly invoke a test function with optional arguments.
 * It is typically used with the `each` function to create parameterized test cases.
 * The provided description will be used for test reporting and identification.
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
 * // As part of the each function with direct arguments
 * test.each(1, 2, 3)('test with %s', (val) => {
 *   expect(val).toBeGreaterThan(0);
 * });
 *
 * test.each(
 *     { name: 'John', age: 30 },
 *     { name: 'Jane', age: 25 }
 * )('User %s is %s years old', (name, age) => {
 *     expect(typeof name).toBe('string');
 *     expect(typeof age).toBe('number');
 * });
 *
 * test.each`
 *     a       | b      | sum
 *     ${ 1 }  | ${ 2 } | ${ 3 }
 *     ${ 2 }  | ${ 5 } | ${ 7 }
 * `('adds $a + $b -> $sum', ({ a, b, sum }) => {
 *     expect(a + b).toBe(sum);
 * });
 *
 * describe.each` a | b | expected ${ 1 } | ${ 2 } | ${ 3 } ${ 2 } | ${ 3 } | ${ 5 }`
 * ('%# adds $a and $b to get $expected', ({ a, b, expected }) => {
 *     test('calculates sum', () => {
 *         expect(a + b).toBe(expected);
 *     });
 * });
 * ```
 *
 * @see InvokeType - Type definition for the executor function
 * @see FunctionType - Type definition for the test block function
 * @see parseTemplate - Function used to parse tagged template literals
 *
 * @since 1.0.0
 */

export function each<T extends Array<unknown>>(executor: InvokeType, ...args: T) {
    if (args.length < 2) {
        throw new Error('`.each` must be called with at leas 2 argument or Tagged Template Literal.');
    }

    // eslint-disable-next-line
    const isTemplateStrings = args[0] instanceof Array && (<any> args[0]).raw !== undefined;
    const cases: Array<unknown> = isTemplateStrings ? parseTemplate(<TemplateStringsArray> args.shift(), args) : args;

    return (name: string, blockFn: FunctionType, timeout?: number): void => {
        cases.forEach((testCase, index) => {
            const parseArgs = Array.isArray(testCase) ? testCase : [ testCase ];
            executor(printf(name, parseArgs, Number(index)), blockFn, parseArgs, timeout);
        });
    };
}
