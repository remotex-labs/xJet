/**
 * Import will remove at compile time
 */

import type { SuiteErrorInterface } from '@messages/interfaces/messages.interface';
import type { JsonDescribeInterface } from '@messages/reports/interfaces/json-reporter.interface';
import type { JsonSuiteInterface, JsonTestInterface } from '@messages/reports/interfaces/json-reporter.interface';

/**
 * Imports
 */

import { dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { stripAnsi } from '@remotex-labs/xansi';
import { JsonReporter } from '@messages/reports/json.reporter';

/**
 * Matches characters that are illegal in an XML 1.0 document.
 *
 * @remarks
 * XML 1.0 only permits the control characters tab (`0x09`), line feed (`0x0A`) and
 * carriage return (`0x0D`); every other code point below `0x20` is forbidden and makes the
 * document unparseable. Highlighted code snippets and stack traces carry ANSI escape
 * sequences whose leading `ESC` (`0x1B`) falls in this range, so they must be stripped
 * before the text is placed inside XML.
 *
 * @since 1.5.7
 */

const INVALID_XML_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

/**
 * JunitReporter converts test results into JUnit-compatible XML format.
 *
 * @remarks
 * Extends the `JsonReporter` to output test results as XML. This reporter traverses the
 * suites, describes, and tests collected during the run, producing a hierarchical XML
 * representation suitable for CI tools such as GitLab.
 *
 * The output targets GitLab's unit test report parser
 * ({@link https://docs.gitlab.com/ci/testing/unit_test_reports/ | Unit test reports}):
 * - Failure and error detail is written as escaped **element text**, since GitLab reads the
 *   description from the element body rather than the `message` attribute.
 * - ANSI escape sequences and other control characters are removed so the document stays
 *   valid XML; otherwise GitLab discards the whole report and shows no results at all.
 * - Suite- and describe-level errors (for example a spec that fails to compile or a failing
 *   `beforeAll`) are surfaced as synthetic `<testcase>` entries carrying an `<error>`, so
 *   load-time failures are visible instead of silently reported as an empty, passing suite.
 * - Each runner is folded into the `classname`, keeping test cases unique across runners so
 *   GitLab does not deduplicate identically named cases from different runners.
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
     * It first aggregates the totals (tests, failures, errors, skipped, time) across every runner
     * and suite, emits a single root `<testsuites>` element carrying those totals, then appends one
     * `<testsuite>` per suite. Suites from different runners stay distinct because the runner name is
     * folded into each test case's `classname`, so GitLab does not deduplicate identically named
     * cases coming from different runners. After building the full XML:
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
        const runners = Object.entries(this.testResults);

        let totalTests = 0;
        let totalFailures = 0;
        let totalErrors = 0;
        let totalSkipped = 0;
        let totalDuration = 0;

        runners.forEach(([ , suitesByName ]) => {
            Object.values(suitesByName).forEach(suite => {
                totalTests += this.countTests(suite.rootDescribe) + this.countErrors(suite);
                totalFailures += this.countFailures(suite.rootDescribe);
                totalErrors += this.countErrors(suite);
                totalSkipped += this.countSkipped(suite.rootDescribe);
                totalDuration += suite.duration ?? 0;
            });
        });

        const rootAttrs = [
            `tests="${ totalTests }"`,
            `failures="${ totalFailures }"`,
            `errors="${ totalErrors }"`,
            `skipped="${ totalSkipped }"`,
            `time="${ this.formatDuration(totalDuration) }"`
        ].join(' ');

        this.xmlParts.push(`<testsuites ${ rootAttrs }>`);
        runners.forEach(([ runnerName, suitesByName ]) => {
            Object.values(suitesByName).forEach(suite => {
                this.convertSuiteToXml(suite, runnerName);
            });
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
     * @param runnerName - The name of the runner that produced the suite, folded into each
     *   test case's `classname` and emitted as the `package` attribute.
     *
     * @remarks
     * This method calculates the total number of tests, failures, errors, skipped tests, and the
     * suite duration. It constructs the `<testsuite>` element with these attributes, recursively
     * converts the root describe block and all nested describes/tests into XML, and finally emits
     * any suite-level errors as synthetic `<testcase>` entries so load-time failures remain visible.
     * The resulting XML fragments are appended to the `xmlParts` array.
     *
     * @example
     * ```ts
     * this.convertSuiteToXml(suite, 'node');
     * // xmlParts will now include <testsuite> with all tests nested inside
     * ```
     *
     * @since 1.0.0
     */

    private convertSuiteToXml(suite: JsonSuiteInterface, runnerName: string): void {
        const rootDescribe = suite.rootDescribe;
        const errors = this.countErrors(suite);
        const tests = this.countTests(rootDescribe) + errors;
        const failures = this.countFailures(rootDescribe);
        const skipped = this.countSkipped(rootDescribe);
        const duration = this.formatDuration(suite.duration);
        const file = this.escapeXml(suite.suiteName);

        const suiteAttrs = [
            `name="${ this.escapeXml(suite.suiteName) }"`,
            `package="${ this.escapeXml(runnerName) }"`,
            `file="${ file }"`,
            `tests="${ tests }"`,
            `failures="${ failures }"`,
            `errors="${ errors }"`,
            `skipped="${ skipped }"`,
            `time="${ duration }"`
        ].join(' ');

        this.xmlParts.push(`<testsuite ${ suiteAttrs }>`);
        this.convertDescribeToXml(rootDescribe, runnerName, suite.suiteName);

        if (suite.errors?.length) {
            const classname = this.buildClassname(runnerName, []);
            this.emitErrorCase(classname, suite.suiteName, file, suite.errors);
        }

        this.xmlParts.push('</testsuite>');
    }

    /**
     * Recursively converts a `describe` block and its nested describes/tests into XML.
     *
     * @param describe - The `describe` block to convert.
     * @param runnerName - The runner that produced the block, folded into each `classname`.
     * @param file - The source file of the owning suite, emitted as the `file` attribute.
     *
     * @remarks
     * This method traverses the hierarchy of a `describe` block:
     * - Converts all tests in the current describe using `convertTestToXml`.
     * - Emits any describe-level errors (for example a failing `beforeAll`) as a synthetic
     *   `<testcase>` carrying an `<error>`, so hook failures are not silently lost.
     * - Recursively processes all nested describes.
     *
     * The resulting XML fragments are appended to the `xmlParts` array.
     *
     * @example
     * ```ts
     * this.convertDescribeToXml(rootDescribe, 'node', 'math.spec.ts');
     * // All tests and nested describes are appended to xmlParts
     * ```
     *
     * @since 1.0.0
     */

    private convertDescribeToXml(describe: JsonDescribeInterface, runnerName: string, file: string): void {
        describe.tests.forEach(test => this.convertTestToXml(test, runnerName, file));

        if (describe.errors?.length) {
            const path = [ ...describe.ancestry, describe.description ].filter(Boolean);
            const classname = this.buildClassname(runnerName, path);
            const name = path.length ? path[path.length - 1] : runnerName;
            this.emitErrorCase(classname, name, this.escapeXml(file), describe.errors);
        }

        describe.describes.forEach(nested => this.convertDescribeToXml(nested, runnerName, file));
    }

    /**
     * Converts a single test into a JUnit `<testcase>` XML element and appends it to `xmlParts`.
     *
     * @param test - The test to convert.
     * @param runnerName - The runner that produced the test, folded into the `classname`.
     * @param file - The source file of the owning suite, emitted as the `file` attribute.
     *
     * @remarks
     * This method constructs the XML representation of a test including:
     * - `classname` combining the runner name with the test ancestry
     * - `name` from the test description
     * - `file` linking the case back to its source in GitLab
     * - `time` from the test duration in seconds
     *
     * It handles different test statuses:
     * - Skipped or TODO tests generate a `<skipped>` child element.
     * - Passed tests generate a self-closing `<testcase>` element.
     * - Failed tests include one or more `<failure>` elements created by `formatIssues`.
     *
     * @example
     * ```ts
     * this.convertTestToXml(test, 'node', 'math.spec.ts');
     * // xmlParts will include a <testcase> element representing this test
     * ```
     *
     * @since 1.0.0
     */

    private convertTestToXml(test: JsonTestInterface, runnerName: string, file: string): void {
        const duration = this.formatDuration(test.duration);
        const name = this.escapeXml(test.description);
        const classname = this.buildClassname(runnerName, test.ancestry);
        const baseAttributes =
            `classname="${ classname }" name="${ name }" file="${ this.escapeXml(file) }" time="${ duration }"`;

        if (test.skipped || test.todo) {
            const reason = test.todo ? 'TODO' : 'Skipped';
            this.xmlParts.push(`<testcase ${ baseAttributes }><skipped message="${ reason }" /></testcase>`);

            return;
        }

        if (test.passed) {
            this.xmlParts.push(`<testcase ${ baseAttributes } />`);

            return;
        }

        const failures = this.formatIssues(test.errors, 'failure');
        this.xmlParts.push(`<testcase ${ baseAttributes }>${ failures }</testcase>`);
    }

    /**
     * Emits a synthetic `<testcase>` carrying `<error>` elements for suite- or describe-level errors.
     *
     * @param classname - The `classname` attribute for the synthetic case.
     * @param name - The `name` attribute describing what failed.
     * @param file - The already-escaped source file of the owning suite.
     * @param errors - The errors to render inside the case.
     *
     * @remarks
     * GitLab only surfaces a failure when it is attached to a test case, so errors raised outside
     * of a test (a spec that fails to load, a failing `beforeAll`, and similar) would otherwise be
     * invisible. Wrapping them in a dedicated case with an `<error>` element keeps them reported.
     *
     * @since 1.5.7
     */

    private emitErrorCase(classname: string, name: string, file: string, errors: Array<SuiteErrorInterface>): void {
        const attributes = `classname="${ classname }" name="${ this.escapeXml(name) }" file="${ file }" time="0.000"`;
        this.xmlParts.push(`<testcase ${ attributes }>${ this.formatIssues(errors, 'error') }</testcase>`);
    }

    /**
     * Formats an array of test errors into JUnit `<failure>` or `<error>` XML elements.
     *
     * @param errors - Array of errors from a test, describe, or suite.
     * @param tag - The element name to emit, either `failure` (assertion failures) or `error`
     *   (unexpected/load-time errors).
     * @returns A string containing one or more `<failure>`/`<error>` XML elements concatenated.
     *
     * @remarks
     * Each error becomes an element whose:
     * - `message` attribute is a single-line summary (`name: message`).
     * - `type` attribute is the error name.
     * - body carries the message, highlighted code snippet, and stack trace as escaped text.
     *
     * All text is passed through {@link JunitReporter.sanitize | `sanitize`} first, which removes
     * ANSI escape sequences and other characters that are illegal in XML. Without this the `ESC`
     * bytes from highlighted output make the document invalid and GitLab discards the entire report,
     * which is why failures previously did not appear. If the errors array is empty or undefined, an
     * empty string is returned.
     *
     * @example
     * ```ts
     * const xmlErrors = this.formatIssues(test.errors, 'failure');
     * // xmlErrors contains <failure> elements for each test error
     * ```
     *
     * @since 1.5.7
     */

    private formatIssues(errors: JsonTestInterface['errors'], tag: 'failure' | 'error'): string {
        if (!errors?.length) return '';

        return errors.map(error => {
            const summary = [ error.name, error.message ].filter(Boolean).join(': ');
            const body = this.sanitize([ error.message, error.formatCode, error.stack ].filter(Boolean).join('\n\n'));

            return `<${ tag } message="${ this.escapeXml(stripAnsi(summary)) }" type="${ this.escapeXml(error.name) }">`
                + `${ body }</${ tag }>`;
        }).join('');
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
     * Builds a JUnit `classname` by folding the runner name into the test ancestry.
     *
     * @param runnerName - The runner that produced the case.
     * @param ancestry - The `describe` ancestry path of the case.
     * @returns The escaped, dot-joined `classname` value.
     *
     * @remarks
     * GitLab keys test cases by `classname` + `name` and keeps only the first case for a given key.
     * Prefixing the ancestry with the runner name keeps cases from different runners distinct and
     * groups them under a per-runner heading in GitLab's UI.
     *
     * @example
     * ```ts
     * this.buildClassname('node', [ 'Math', 'add' ]); // "node.Math.add"
     * this.buildClassname('node', []);                // "node"
     * ```
     *
     * @since 1.5.7
     */

    private buildClassname(runnerName: string, ancestry: Array<string>): string {
        return this.escapeXml([ runnerName, ...ancestry ].filter(Boolean).join('.'));
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
     * Counts the total number of error-level entries surfaced as synthetic test cases for a suite.
     *
     * @param suite - The suite to count errors in.
     * @returns The combined number of suite-level and describe-level errors.
     *
     * @remarks
     * These errors originate outside of individual tests (suite load failures, failing lifecycle
     * hooks) and are emitted as synthetic `<testcase>` entries, so they must be reflected in both
     * the `tests` and `errors` totals for the counts to match the emitted XML.
     *
     * @since 1.5.7
     */

    private countErrors(suite: JsonSuiteInterface): number {
        return (suite.errors?.length ?? 0) + this.countDescribeErrors(suite.rootDescribe);
    }

    /**
     * Counts describe-level errors within a `describe` block, including nested describes.
     *
     * @param describe - The `describe` block to count errors in.
     * @returns The total number of describe-level errors including all nested describes.
     *
     * @since 1.5.7
     */

    private countDescribeErrors(describe: JsonDescribeInterface): number {
        const current = describe.errors?.length ?? 0;

        return current + describe.describes.reduce((sum, nested) => sum + this.countDescribeErrors(nested), 0);
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
     * Removes control characters that are illegal in XML, then escapes the result for XML text.
     *
     * @param str - The string to sanitize.
     * @returns Text that is safe to embed as XML element content.
     *
     * @remarks
     * Highlighted code snippets and stack traces contain ANSI escape sequences whose `ESC` byte
     * (`0x1B`) is not a legal XML 1.0 character. Emitting them raw makes the whole document invalid,
     * which causes GitLab to reject the report and display no results. This helper strips the ANSI
     * sequences, drops any remaining illegal control characters, and finally escapes the XML
     * metacharacters via {@link JunitReporter.escapeXml | `escapeXml`}.
     *
     * @since 1.5.7
     */

    private sanitize(str: string): string {
        return this.escapeXml(stripAnsi(str).replace(INVALID_XML_CHARS, ''));
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
