/**
 * Import will remove at compile time
 */

import type { JsonDescribeInterface } from '@messages/reports/interfaces/json-reporter.interface';
import type { JsonSuiteInterface, JsonTestInterface } from '@messages/reports/interfaces/json-reporter.interface';

/**
 * Imports
 */

import { dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { JsonReporter } from '@messages/reports/json.reporter';

/**
 * JunitReporter converts test results into JUnit-compatible XML format.
 *
 * @remarks
 * Extends the `JsonReporter` to output test results as XML. This reporter
 * traverses the suites, describes, and tests collected during the run,
 * producing a hierarchical XML representation suitable for CI tools.
 *
 * @example
 * ```ts
 * const reporter = new JunitReporter();
 * reporter.testStart({ ... });
 * reporter.testEnd({ ... });
 * reporter.finish(); // Outputs JUnit XML to console or file
 * ```
 *
 * @since 1.0.0
 */

export class JunitReporter extends JsonReporter {
    /**
     * Parts of the XML document being built during test result conversion.
     *
     * @remarks
     * This array stores fragments of the JUnit XML output as strings. The final XML
     * is constructed by joining these parts together in `finish()`. It is initialized
     * with the XML declaration and grows as suites, describes, and tests are converted
     * to XML.
     *
     * @example
     * ```ts
     * this.xmlParts.push('<testsuite name="ExampleSuite">');
     * this.xmlParts.push('</testsuite>');
     * const xmlContent = this.xmlParts.join('\n');
     * ```
     *
     * @since 1.0.0
     */

    protected xmlParts: Array<string> = [ '<?xml version="1.0" encoding="UTF-8"?>' ];

    /**
     * Finalizes the JUnit XML report and outputs it.
     *
     * @remarks
     * This method constructs the complete JUnit XML document from the collected test results.
     * It iterates over all test runners and their suites, converts them into XML format,
     * and appends them to the internal `xmlParts` array. After building the full XML:
     * - If `outFilePath` is defined, the XML is written to the specified file.
     * - The XML is also logged to the console.
     *
     * @example
     * ```ts
     * reporter.finish(); // Generates and outputs the complete JUnit XML
     * ```
     *
     * @since 1.0.0
     */

    finish(): void {
        this.xmlParts.push('<testsuites>');
        Object.entries(this.testResults).forEach(([ runnerName, suitesByName ]) => {
            this.xmlParts.push(`<testsuites name="${ runnerName }">`);

            Object.values(suitesByName).forEach(suite => {
                this.convertSuiteToXml(suite);
            });

            this.xmlParts.push('</testsuites>');
        });

        this.xmlParts.push('</testsuites>');
        const xmlContent = this.xmlParts.join('\n');
        if(this.outFilePath) {
            const folderPath = dirname(this.outFilePath);
            mkdirSync(folderPath, { recursive: true });
            writeFileSync(this.outFilePath, xmlContent);
        }

        console.log(xmlContent);
    }

    /**
     * Converts a test suite into a JUnit `<testsuite>` XML element and appends it to `xmlParts`.
     *
     * @param suite - The test suite to convert to XML.
     *
     * @remarks
     * This method calculates the total number of tests, failures, skipped tests, and the suite duration.
     * It constructs the `<testsuite>` element with these attributes and recursively converts
     * the root describe block and all nested describes/tests into XML. The resulting XML
     * fragments are appended to the `xmlParts` array.
     *
     * @example
     * ```ts
     * this.convertSuiteToXml(suite);
     * // xmlParts will now include <testsuite> with all tests nested inside
     * ```
     *
     * @since 1.0.0
     */

    private convertSuiteToXml(suite: JsonSuiteInterface): void {
        const rootDescribe = suite.rootDescribe;
        const tests = this.countTests(rootDescribe);
        const failures = this.countFailures(rootDescribe);
        const skipped = this.countSkipped(rootDescribe);
        const duration = this.formatDuration(suite.duration);

        const suiteAttrs = [
            `name="${ suite.suiteName }"`,
            `tests="${ tests }"`,
            `failures="${ failures }"`,
            `skipped="${ skipped }"`,
            `time="${ duration }"`
        ].join(' ');

        this.xmlParts.push(`<testsuite ${ suiteAttrs }>`);
        this.convertDescribeToXml(rootDescribe);
        this.xmlParts.push('</testsuite>');
    }

    /**
     * Recursively converts a `describe` block and its nested describes/tests into XML.
     *
     * @param describe - The `describe` block to convert.
     *
     * @remarks
     * This method traverses the hierarchy of a `describe` block:
     * - Converts all tests in the current describe using `convertTestToXml`.
     * - Recursively processes all nested describes.
     *
     * The resulting XML fragments are appended to the `xmlParts` array.
     *
     * @example
     * ```ts
     * this.convertDescribeToXml(rootDescribe);
     * // All tests and nested describes are appended to xmlParts
     * ```
     *
     * @since 1.0.0
     */

    private convertDescribeToXml(describe: JsonDescribeInterface): void {
        describe.tests.forEach(test => this.convertTestToXml(test));
        describe.describes.forEach(nested => this.convertDescribeToXml(nested));
    }

    /**
     * Converts a single test into a JUnit `<testcase>` XML element and appends it to `xmlParts`.
     *
     * @param test - The test to convert.
     *
     * @remarks
     * This method constructs the XML representation of a test including:
     * - `classname` based on its ancestry
     * - `name` from the test description
     * - `time` from the test duration in seconds
     *
     * It handles different test statuses:
     * - Skipped or TODO tests generate a `<skipped>` child element.
     * - Passed tests generate a self-closing `<testcase>` element.
     * - Failed tests include one or more `<failure>` elements created by `formatErrors`.
     *
     * @example
     * ```ts
     * this.convertTestToXml(test);
     * // xmlParts will include a <testcase> element representing this test
     * ```
     *
     * @since 1.0.0
     */

    private convertTestToXml(test: JsonTestInterface): void {
        const duration = this.formatDuration(test.duration);
        const name = test.description;
        const classname = test.ancestry.join('.') || 'root';
        const baseAttributes = `classname="${ classname }" name="${ name }" time="${ duration }"`;

        if (test.skipped || test.todo) {
            const reason = test.todo ? 'TODO' : 'Skipped';
            this.xmlParts.push(`<testcase ${ baseAttributes }><skipped message="${ reason }" /></testcase>`);

            return;
        }

        if (test.passed) {
            this.xmlParts.push(`<testcase ${ baseAttributes } />`);

            return;
        }

        const errors = this.formatErrors(test.errors);
        this.xmlParts.push(`<testcase ${ baseAttributes }>${ errors }</testcase>`);
    }

    /**
     * Formats an array of test errors into JUnit `<failure>` XML elements.
     *
     *
     * @param errors - Array of errors from a test.
     * @returns A string containing one or more `<failure>` XML elements concatenated.
     *
     * @remarks
     * Each error is converted into a `<failure>` element with:
     * - `message` attribute from the error name
     * - Escaped error message and stack trace inside the element
     * - Optional `formatCode` content if provided
     *
     * If the errors array is empty or undefined, an empty string is returned.
     *
     * @example
     * ```ts
     * const xmlErrors = this.formatErrors(test.errors);
     * // xmlErrors contains <failure> elements for each test error
     * ```
     *
     * @since 1.0.0
     */

    private formatErrors(errors: JsonTestInterface['errors']): string {
        if (!errors?.length) return '';

        return errors.map(e =>
            `<failure message="${ e.name }">${ this.escapeXml(e.message) }\n${ e.formatCode }\n\n${ this.escapeXml(e.stack) }</failure>`
        ).join('');
    }

    /**
     * Converts a duration from milliseconds to seconds as a string with three decimal places.
     *
     * @param duration - The duration in milliseconds.
     * @returns The duration in seconds as a string with three decimal places.
     *
     * @remarks
     * If the input duration is `undefined`, it defaults to `0`. The output is formatted
     * as a string suitable for inclusion in JUnit XML `time` attributes.
     *
     * @example
     * ```ts
     * const seconds = this.formatDuration(1234); // "1.234"
     * const zero = this.formatDuration();       // "0.000"
     * ```
     *
     * @since 1.0.0
     */

    private formatDuration(duration?: number): string {
        return ((duration ?? 0) / 1000).toFixed(3);
    }

    /**
     * Counts the total number of tests within a `describe` block, including nested describes.
     *
     * @param describe - The `describe` block to count tests in.
     * @returns The total number of tests including all nested describes.
     *
     * @remarks
     * This method recursively traverses all nested `describe` blocks to calculate
     * the total number of tests. Only actual test entries in the `tests` array are counted;
     * skipped or todo tests are included in this count.
     *
     * @example
     * ```ts
     * const totalTests = this.countTests(rootDescribe);
     * console.log(totalTests); // e.g., 15
     * ```
     *
     * @since 1.0.0
     */

    private countTests(describe: JsonDescribeInterface): number {
        return describe.tests.length + describe.describes.reduce((sum, nested) => sum + this.countTests(nested), 0);
    }

    /**
     * Counts the total number of skipped or TODO tests within a `describe` block, including nested describes.
     *
     * @param describe - The `describe` block to count skipped or TODO tests in.
     * @returns The total number of skipped or TODO tests including all nested describes.
     *
     * @remarks
     * This method recursively traverses all nested `describe` blocks. A test is counted as skipped
     * if its `skipped` or `todo` property is `true`.
     *
     * @example
     * ```ts
     * const skippedTests = this.countSkipped(rootDescribe);
     * console.log(skippedTests); // e.g., 3
     * ```
     *
     * @since 1.0.0
     */

    private countSkipped(describe: JsonDescribeInterface): number {
        const skippedInCurrent = describe.tests.filter(t => t.skipped || t.todo).length;

        return skippedInCurrent + describe.describes.reduce((sum, nested) => sum + this.countSkipped(nested), 0);
    }

    /**
     * Counts the total number of failed tests within a `describe` block, including nested describes.
     *
     * @param describe - The `describe` block to count failed tests in.
     * @returns The total number of failed tests including all nested describes.
     *
     * @remarks
     * This method recursively traverses all nested `describe` blocks. A test is counted as a failure
     * if it is not passed, not skipped, and not marked as TODO.
     *
     * @example
     * ```ts
     * const failedTests = this.countFailures(rootDescribe);
     * console.log(failedTests); // e.g., 2
     * ```
     *
     * @since 1.0.0
     */

    private countFailures(describe: JsonDescribeInterface): number {
        const failuresInCurrent = describe.tests.filter(t => !t.passed && !t.skipped && !t.todo).length;

        return failuresInCurrent + describe.describes.reduce((sum, nested) => sum + this.countFailures(nested), 0);
    }

    /**
     * Escapes special XML characters in a string to ensure valid XML output.
     *
     * @param str - The string to escape.
     * @returns The escaped string safe for XML content.
     *
     * @remarks
     * This method replaces the following characters with their corresponding XML entities:
     * - `&` → `&amp;`
     * - `"` → `&quot;`
     * - `'` → `&apos;`
     * - `<` → `&lt;`
     * - `>` → `&gt;`
     *
     * @example
     * ```ts
     * const safeXml = this.escapeXml('<div class="example">Hello & Welcome</div>');
     * console.log(safeXml);
     * // &lt;div class=&quot;example&quot;&gt;Hello &amp; Welcome&lt;/div&gt;
     * ```
     *
     * @since 1.0.0
     */

    private escapeXml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
