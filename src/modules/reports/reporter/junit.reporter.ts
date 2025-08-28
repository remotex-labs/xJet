/**
 * Import will remove at compile time
 */

import type { JsonDescribeInterface } from '@reports/reporter/interfaces/json-reporter.interface';
import type { JsonSuiteInterface, JsonTestInterface } from '@reports/reporter/interfaces/json-reporter.interface';

/**
 * Imports
 */

import { writeFileSync } from 'fs';
import { JsonReporter } from '@reports/reporter/json.reporter';

/**
 * JUnit reporter that converts JSON test results into JUnit XML format.
 *
 * @remarks
 * Extends {@link JsonReporter} to output test results in a JUnit-compatible XML format.
 * Writes the XML content to `outFilePath` if provided and logs it to the console.
 *
 * @since 1.0.0
 */

export class JunitReporter extends JsonReporter {
    /**
     * Stores parts of the XML document as it is being built.
     *
     * @remarks
     * Initialized with the XML declaration.
     * Further methods append suites, describes, and tests to this array before final output.
     *
     * @since 1.0.0
     */

    protected xmlParts: Array<string> = [ '<?xml version="1.0" encoding="UTF-8"?>' ];

    /**
     * Finalizes the reporter by converting all test results to JUnit XML and outputting them.
     *
     * @remarks
     * Wraps all suites under `<testsuites>` elements per runner.
     * Writes XML to `outFilePath` if provided, and prints to the console.
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
        if (this.outFilePath) writeFileSync(this.outFilePath, xmlContent);

        console.log(xmlContent);
    }

    /**
     * Converts a single suite into JUnit XML format.
     *
     * @param suite - The suite to convert
     * @see JsonSuiteInterface
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
     * Converts a `describe` block and its nested tests/describes to XML recursively.
     *
     * @param describe - The `describe` block to convert
     * @see JsonDescribeInterface
     *
     * @since 1.0.0
     */

    private convertDescribeToXml(describe: JsonDescribeInterface): void {
        describe.tests.forEach(test => this.convertTestToXml(test));
        describe.describes.forEach(nested => this.convertDescribeToXml(nested));
    }

    /**
     * Converts a single test to XML format.
     *
     * @param test - The test to convert
     * @see JsonTestInterface
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
     * Formats errors into JUnit `<failure>` elements.
     *
     * @param errors - Optional array of errors
     * @returns XML string for failures
     *
     * @see JsonTestInterface
     * @see ErrorEventInterface
     *
     * @since 1.0.0
     */

    private formatErrors(errors: JsonTestInterface['errors']): string {
        if (!errors?.length) return '';

        return errors.map(e =>
            `<failure message="${ this.escapeXml(e.message) }">${ this.escapeXml(e.stacks) }</failure>`
        ).join('');
    }

    /**
     * Formats a duration in milliseconds to seconds with 3 decimal places.
     *
     * @param duration - Duration in milliseconds
     * @returns Duration as a string in seconds
     *
     * @since 1.0.0
     */

    private formatDuration(duration?: number): string {
        return ((duration ?? 0) / 1000).toFixed(3);
    }

    /**
     * Recursively counts all tests within a `describe` block.
     *
     * @param describe - The describe block
     * @returns Total number of tests
     *
     * @see JsonDescribeInterface
     * @since 1.0.0
     */

    private countTests(describe: JsonDescribeInterface): number {
        return describe.tests.length + describe.describes.reduce((sum, nested) => sum + this.countTests(nested), 0);
    }

    /**
     * Recursively counts all skipped or TODO tests within a describe block.
     *
     * @param describe - The describe block
     * @returns Total number of skipped tests
     *
     * @see JsonDescribeInterface
     * @since 1.0.0
     */

    private countSkipped(describe: JsonDescribeInterface): number {
        const skippedInCurrent = describe.tests.filter(t => t.skipped || t.todo).length;

        return skippedInCurrent + describe.describes.reduce((sum, nested) => sum + this.countSkipped(nested), 0);
    }

    /**
     * Recursively counts all failed tests within a `describe` block.
     *
     * @param describe - The describe block
     * @returns Total number of failed tests
     *
     * @see JsonDescribeInterface
     * @since 1.0.0
     */

    private countFailures(describe: JsonDescribeInterface): number {
        const failuresInCurrent = describe.tests.filter(t => !t.passed && !t.skipped && !t.todo).length;

        return failuresInCurrent + describe.describes.reduce((sum, nested) => sum + this.countFailures(nested), 0);
    }

    /**
     * Escapes special characters in a string for XML output.
     *
     * @param str - The string to escape
     * @returns Escaped string
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
