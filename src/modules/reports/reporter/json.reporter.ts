/**
 * Import will remove at compile time
 */

import type { JsonTestInterface } from '@reports/reporter/interfaces/json-reporter.interface';
import type { DescribeEndInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { LogInterface, RunnerInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { DescribableInterface, TestEndInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { SuiteEndInterface, SuiteStartInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { JsonDescribeInterface, JsonSuiteInterface } from '@reports/reporter/interfaces/json-reporter.interface';

/**
 * Imports
 */

import { writeFileSync } from 'fs';
import { AbstractReporter } from '@reports/abstract/report.abstract';

/**
 * JSON reporter for test execution results.
 *
 * @remarks
 * Collects suites, describes, tests, logs, and errors, and outputs the results
 * as a JSON object at the end of test execution.
 *
 * @since 1.0.0
 */

export class JsonReporter extends AbstractReporter {
    /**
     * Stores all suites by runner name and suite name.
     *
     * @since 1.0.0
     */

    protected testResults: Record<string, Record<string, JsonSuiteInterface>> = {};

    /**
     * Records a `log` entry for the appropriate test or describe block.
     *
     * @param log - The log entry to record
     *
     * @see LogInterface
     * @since 1.0.0
     */

    log(log: LogInterface): void {
        const suite = this.getSuite(log.runner, log.suiteName);
        const parent = this.findParentDescribe(suite, log.ancestry);
        if (!parent) return;

        parent.logs = parent.logs ?? [];
        parent.logs.push(log.message);
    }

    /**
     * Initializes a `suite` at the start of test execution.
     *
     * @param event - Suite start event information
     *
     * @see SuiteStartInterface
     * @since 1.0.0
     */

    suiteStart(event: SuiteStartInterface): void {
        const key = event.suiteName;
        const name = event.runner.name;

        this.testResults[name] = this.testResults[name] ?? {};
        this.testResults[name][key] = {
            runner: event.runner,
            suiteName: event.suiteName,
            timestamp: event.timestamp,
            rootDescribe: {
                tests: [],
                ancestry: [],
                describes: [],
                description: '',
                timestamp: event.timestamp
            }
        };
    }

    /**
     * Handles the end of a `suite`, recording any suite-level errors.
     *
     * @param event - Suite end event information
     *
     * @see SuiteEndInterface
     * @since 1.0.0
     */

    suiteEnd(event: SuiteEndInterface): void {
        const suite = this.getSuite(event.runner, event.suiteName);

        suite.duration = event.duration;
        suite.rootDescribe.duration = event.duration;

        if (event.errors && event.errors.length > 0) {
            suite.errors = suite.errors ?? [];
            suite.errors.push(...event.errors);
        }
    }

    /**
     * Records the start of a `describe` block.
     *
     * @param event - Describe block start event information
     *
     * @see DescribableInterface
     * @see JsonDescribeInterface
     *
     * @since 1.0.0
     */

    describeStart(event: DescribableInterface): void {
        const describeJson: JsonDescribeInterface = {
            tests: [],
            describes: [],
            skipped: event.skipped ?? false,
            ancestry: event.ancestry,
            timestamp: event.timestamp,
            description: event.description
        };

        const suite = this.getSuite(event.runner, event.suiteName);
        const parent = this.findParentDescribe(suite, event.ancestry);
        if (parent) parent.describes.push(describeJson);
        else suite.rootDescribe.describes.push(describeJson);
    }

    /**
     * Records the end of a `describe` block, including any errors and skipped status.
     *
     * @param event - Describe block end event information
     *
     * @see DescribeEndInterface
     * @see JsonDescribeInterface
     *
     * @since 1.0.0
     */

    describeEnd(event: DescribeEndInterface): void {
        const suite = this.getSuite(event.runner, event.suiteName);
        const describe = this.findParentDescribe(suite, event.ancestry);
        if (!describe) return;

        if (event.errors && event.errors.length > 0) {
            describe.errors = describe.errors ?? [];
            describe.errors.push(...event.errors);
        }

        describe.duration = event.duration;
        if (event.skipped) describe.skipped = true;
    }

    /**
     * Records the end of a `test`, including logs, errors, and status flags.
     *
     * @param event - Test end event information
     *
     * @see TestEndInterface
     * @see JsonTestInterface
     * @since 1.0.0
     */

    testEnd(event: TestEndInterface): void {
        const suite = this.getSuite(event.runner, event.suiteName);
        const parent = this.findParentDescribe(suite, event.ancestry);
        if (!parent) return;

        const testJson: JsonTestInterface = {
            logs: [],
            todo: event.todo,
            passed: event.passed,
            errors: event.errors ?? [],
            skipped: event.skipped ?? false,
            ancestry: event.ancestry,
            duration: event.duration,
            timestamp: event.timestamp,
            description: event.description
        };

        parent.tests.push(testJson);
    }

    /**
     * Finalizes the reporter and outputs the collected JSON data.
     *
     * @remarks
     * If `outFilePath` is provided, the JSON results are written to that file.
     * The results are also printed to the console.
     * In watch mode, this method is called for each session of test execution.
     *
     * @since 1.0.0
     */

    finish(): void {
        const result = JSON.stringify(this.testResults, null, 4);
        if(this.outFilePath) {
            writeFileSync(this.outFilePath, result);
        }

        console.log(result);
    }

    /**
     * Retrieves a suite by runner information.
     *
     * @param runner - Runner information
     * @param suiteName - Name of the test suite associated with the runner
     * @returns The corresponding {@link JsonSuiteInterface}
     *
     * @throws Error - If the suite is not found
     * @since 1.0.0
     */

    private getSuite(runner: RunnerInterface, suiteName: string): JsonSuiteInterface {
        const name = runner.name;

        if(!this.testResults[name] || !this.testResults[name][suiteName])
            throw new Error(`Suite not found: ${ name } -> ${ suiteName }`);

        return this.testResults[name][suiteName];
    }

    /**
     * Finds the parent describe block based on ancestry.
     *
     * @param suite - The suite containing describes
     * @param ancestry - Array of ancestor descriptions leading to the target
     * @returns The parent {@link JsonDescribeInterface} or root describe
     *
     * @since 1.0.0
     */

    private findParentDescribe(suite: JsonSuiteInterface, ancestry: Array<string>): JsonDescribeInterface & JsonTestInterface {
        if (ancestry.length === 0) return suite.rootDescribe;
        let currentDescribes = suite.rootDescribe.describes ?? [];
        let parent: JsonDescribeInterface | undefined;

        for (const name of ancestry) {
            parent = currentDescribes.find(d => d.description === name);
            if (!parent) return suite.rootDescribe;
            currentDescribes = parent.describes;
        }

        return <JsonDescribeInterface> parent;
    }
}
