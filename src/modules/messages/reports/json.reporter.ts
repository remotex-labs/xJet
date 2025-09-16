/**
 * Import will remove at compile time
 */

import type { RunnerInterface } from '@targets/interfaces/traget.interface';
import type { EndMessageInterface } from '@messages/interfaces/messages.interface';
import type { EndAssertionMessageInterface } from '@messages/interfaces/messages.interface';
import type { JsonTestInterface } from '@messages/reports/interfaces/json-reporter.interface';
import type { StartAssertionMessageInterface, StartMessageInterface } from '@messages/interfaces/messages.interface';
import type { JsonDescribeInterface, JsonSuiteInterface } from '@messages/reports/interfaces/json-reporter.interface';

/**
 * Imports
 */

import { dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { AbstractReporter } from '@messages/abstract/report.abstract';

/**
 * Reporter implementation that generates a JSON representation of test execution results.
 *
 * @remarks
 * The {@link JsonReporter} class extends {@link AbstractReporter} and is responsible for
 * capturing suite, describe, and test events during execution.
 * Results are aggregated in memory as a nested object structure and written to disk
 * (and `stdout`) when {@link finish} is called.
 * This allows external tools to consume structured test output for analysis, dashboards,
 * or CI integrations.
 *
 * @example
 * ```ts
 * const reporter = new JsonReporter();
 * reporter.init(['math.spec.ts'], [runner]);
 * // events will populate `reporter.testResults`
 * reporter.finish(); // writes JSON file if `outFilePath` is set
 * ```
 *
 * @see AbstractReporter
 * @see JsonTestInterface
 * @see JsonSuiteInterface
 * @see JsonDescribeInterface
 *
 * @since 1.0.0
 */

export class JsonReporter extends AbstractReporter {
    /**
     * Holds aggregated results, keyed by runner and suite name.
     *
     * @remarks
     * Structure:
     * ```ts
     * {
     *   runnerName: {
     *     suiteName: JsonSuiteInterface
     *   }
     * }
     * ```
     *
     * @since 1.0.0
     */

    protected testResults: Record<string, Record<string, JsonSuiteInterface>> = {};

    /**
     * Initializes result containers for all suites and runners prior to execution.
     *
     * @param suites - An array of suite names (usually file paths or identifiers)
     *   that will be executed.
     * @param runners - An array of runner instances, each implementing {@link RunnerInterface},
     *   representing the environments in which the suites will run.
     *
     * @remarks
     * This method pre-populates the {@link JsonReporter.testResults | `testResults`} map
     * with an entry for every suite–runner combination.
     * Each entry is initialized with an empty {@link JsonSuiteInterface} structure,
     * including a root {@link JsonDescribeInterface}, so that subsequent events
     * (such as tests and describes) can be safely appended without requiring null checks.
     *
     * @example
     * ```ts
     * reporter.init(['math.spec.ts'], [ { name: 'node' } ]);
     * console.log(reporter.testResults.node['math.spec.ts']);
     * // {
     * //   runner: 'node',
     * //   suiteName: 'math.spec.ts',
     * //   timestamp: Date,
     * //   rootDescribe: { tests: [], describes: [], ... }
     * // }
     * ```
     *
     * @since 1.0.0
     */

    init(suites: Array<string>, runners: Array<RunnerInterface>): void {
        for (const suiteName of suites) {
            for (const runner of runners) {
                this.testResults[runner.name] = this.testResults[runner.name] ?? {};
                this.testResults[runner.name][suiteName] = {
                    runner: runner.name,
                    suiteName: suiteName,
                    timestamp: new Date(),
                    rootDescribe: {
                        tests: [],
                        ancestry: [],
                        describes: [],
                        description: '',
                        timestamp: new Date()
                    }
                };
            }
        }
    }

    /**
     * Marks the start of a test suite execution and initializes its result container.
     *
     * @remarks
     * This method creates a fresh {@link JsonSuiteInterface} entry in
     * {@link JsonReporter.testResults | `testResults`} for the specified runner–suite pair.
     * It ensures that any prior results are replaced with a clean structure,
     * containing a root {@link JsonDescribeInterface} to collect nested describes and tests.
     *
     * Typically called when the reporter receives a {@link StartMessageInterface} event
     * signaling the beginning of a suite.
     *
     * @param event - The suite start event, containing the suite name,
     *   runner identifier, and timestamp of the start.
     *
     * @example
     * ```ts
     * reporter.suiteStart({
     *   runner: 'node',
     *   suite: 'math.spec.ts',
     *   timestamp: new Date()
     * });
     *
     * console.log(reporter.testResults.node['math.spec.ts']);
     * // {
     * //   runner: 'node',
     * //   suiteName: 'math.spec.ts',
     * //   timestamp: Date,
     * //   rootDescribe: { tests: [], describes: [], ... }
     * // }
     * ```
     *
     * @see JsonSuiteInterface
     * @see JsonDescribeInterface
     *
     * @since 1.0.0
     */

    suiteStart(event: StartMessageInterface): void {
        const key = event.suite;
        const name = event.runner;

        this.testResults[name][key] = {
            runner: event.runner,
            suiteName: key,
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
     * Handles the completion of a test suite and updates its metadata.
     *
     * @param event - The event object containing details about the completed suite.
     *
     * @remarks
     * This method is invoked when a test suite finishes execution. It updates the suite's
     * duration, the root describe block's duration, and records any errors that occurred
     * during the suite's execution. If the suite already has errors, the new error is
     * appended to the existing list; otherwise, a new errors array is created.
     *
     * @example
     * ```ts
     * suiteEnd({
     *   runner: 'jest',
     *   suite: 'UserService tests',
     *   duration: 1250,
     *   error: new Error('Test failed')
     * });
     * ```
     *
     * @since 1.0.0
     */

    suiteEnd(event: EndMessageInterface): void {
        const suite = this.getSuite(event.runner, event.suite);

        suite.duration = event.duration;
        suite.rootDescribe.duration = event.duration;

        if (event.error) {
            suite.errors = suite.errors ?? [];
            suite.errors.push(event.error);
        }
    }

    /**
     * Handles the start of a `describe` block in a test suite and registers it in the suite hierarchy.
     *
     * @param event - The event object containing information about the `describe` block.
     *
     * @remarks
     * This method is called when a `describe` block begins execution. It constructs a JSON
     * representation of the `describe` block, including its ancestry, description, timestamp,
     * and skipped status. The block is then inserted into the appropriate parent within the
     * suite's structure. If no parent exists, it is added to the suite's `rootDescribe`.
     *
     * @example
     * ```ts
     * describeStart({
     *   runner: 'jest',
     *   suite: 'UserService tests',
     *   ancestry: ['Authentication tests'],
     *   description: 'Login functionality',
     *   timestamp: Date.now(),
     *   skipped: false
     * });
     * ```
     *
     * @since 1.0.0
     */

    describeStart(event: StartAssertionMessageInterface): void {
        if(event.description === '') return;
        const describeJson: JsonDescribeInterface = {
            tests: [],
            describes: [],
            skipped: event.skipped ?? false,
            ancestry: event.ancestry,
            timestamp: event.timestamp,
            description: event.description
        };

        const suite = this.getSuite(event.runner, event.suite);
        const parent = this.findParentDescribe(suite, event.ancestry);
        if (parent) parent.describes.push(describeJson);
        else suite.rootDescribe.describes.push(describeJson);
    }

    /**
     * Handles the completion of a `describe` block and updates its metadata.
     *
     * @param event - The event object containing details about the completed `describe` block.
     *
     * @remarks
     * This method is invoked when a `describe` block finishes execution. It updates the block's
     * duration and records any errors that occurred during its execution. If the block already
     * has errors, new errors are appended to the existing list; otherwise, a new errors array
     * is created. If the specified `describe` block cannot be found in the suite, the method
     * exits silently.
     *
     * @example
     * ```ts
     * describeEnd({
     *   runner: 'jest',
     *   suite: 'UserService tests',
     *   ancestry: ['Authentication tests'],
     *   duration: 320,
     *   errors: [new Error('Login failed')]
     * });
     * ```
     *
     * @since 1.0.0
     */

    describeEnd(event: EndAssertionMessageInterface): void {
        const suite = this.getSuite(event.runner, event.suite);
        const describe = this.findParentDescribe(suite, event.ancestry);
        if (!describe) return;

        if (event.errors && event.errors.length > 0) {
            describe.errors = describe.errors ?? [];
            describe.errors.push(...event.errors);
        }

        describe.duration = event.duration;
    }

    /**
     * Handles the start of a test that is either skipped or marked as `todo` and registers it under its parent `describe`.
     *
     * @param event - The event object containing details about the test.
     *
     * @remarks
     * This method is invoked when a test begins execution but is either skipped or flagged as `todo`.
     * It constructs a JSON representation of the test, including its ancestry, description, timestamp,
     * skipped status, and todo status, and then inserts it into the appropriate parent `describe` block
     * within the suite. If the parent cannot be found, the method exits silently.
     *
     * @example
     * ```ts
     * testStart({
     *   runner: 'jest',
     *   suite: 'UserService tests',
     *   ancestry: ['Authentication tests'],
     *   description: 'Login with invalid credentials',
     *   timestamp: Date.now(),
     *   skipped: true,
     *   todo: false
     * });
     * ```
     *
     * @since 1.0.0
     */

    testStart(event: StartAssertionMessageInterface): void {
        if(!event.skipped && !event.todo) return;

        const suite = this.getSuite(event.runner, event.suite);
        const parent = this.findParentDescribe(suite, event.ancestry);
        if (!parent) return;

        const testJson: JsonTestInterface = {
            todo: event.todo,
            skipped: event.skipped,
            ancestry: event.ancestry,
            timestamp: event.timestamp,
            description: event.description
        };

        parent.tests.push(testJson);
    }

    /**
     * Handles the completion of a test and registers its results under the appropriate parent `describe`.
     *
     * @param event - The event object containing details about the completed test.
     *
     * @remarks
     * This method is called when a test finishes execution. It constructs a JSON representation
     * of the test, including its pass/fail status, errors, ancestry, duration, timestamp, and description.
     * The test result is then added to the parent `describe` block within the suite. If the parent
     * cannot be found, the method exits silently.
     *
     * @example
     * ```ts
     * testEnd({
     *   runner: 'jest',
     *   suite: 'UserService tests',
     *   ancestry: ['Authentication tests'],
     *   description: 'Login with invalid credentials',
     *   timestamp: Date.now(),
     *   duration: 120,
     *   passed: false,
     *   errors: [new Error('Invalid credentials')]
     * });
     * ```
     *
     * @since 1.0.0
     */

    testEnd(event: EndAssertionMessageInterface): void {
        const suite = this.getSuite(event.runner, event.suite);
        const parent = this.findParentDescribe(suite, event.ancestry);
        if (!parent) return;

        const testJson: JsonTestInterface = {
            passed: event.passed,
            errors: event.errors ?? [],
            ancestry: event.ancestry,
            duration: event.duration,
            timestamp: event.timestamp,
            description: event.description
        };

        parent.tests.push(testJson);
    }

    /**
     * Finalizes the test run, outputs the results, and optionally writes them to a file.
     *
     * @remarks
     * This method serializes all collected test results into a JSON string with indentation
     * for readability. If an output file path (`outFilePath`) is specified, it writes the JSON
     * results to that file. Regardless of file output, the results are also logged to the console.
     *
     * @example
     * ```ts
     * // Finish a test run and write results to a file
     * testTracker.outFilePath = './results.json';
     * testTracker.finish();
     * ```
     *
     * @since 1.0.0
     */

    finish(): void {
        const result = JSON.stringify(this.testResults, null, 4);
        if(this.outFilePath) {
            const folderPath = dirname(this.outFilePath);
            mkdirSync(folderPath, { recursive: true });
            writeFileSync(this.outFilePath, result);
        }

        console.log(result);
    }

    /**
     * Retrieves a test suite by its runner and suite name from the collected test results.
     *
     * @param runner - The name or identifier of the test runner.
     * @param suiteName - The name or identifier of the suite to retrieve.
     * @returns The `JsonSuiteInterface` object representing the requested suite.
     *
     * @throws Will throw an error if the specified suite does not exist for the given runner.
     *
     * @remarks
     * This method looks up a suite within `testResults` using the provided runner and suite name.
     * If the suite does not exist, it throws an error. This ensures that any operations on suites
     * are performed on valid, existing data.
     *
     * @example
     * ```ts
     * const suite = this.getSuite('jest', 'UserService tests');
     * console.log(suite.rootDescribe.tests);
     * ```
     *
     * @since 1.0.0
     */

    private getSuite(runner: string, suiteName: string): JsonSuiteInterface {
        if(!this.testResults[runner] || !this.testResults[runner][suiteName])
            throw new Error(`Suite not found: ${ runner } -> ${ suiteName }`);

        return this.testResults[runner][suiteName];
    }

    /**
     * Finds the parent `describe` block within a suite based on the provided ancestry.
     *
     * @param suite - The suite in which to search for the parent `describe`.
     * @param ancestry - An array of strings representing the hierarchy of parent `describe` names.
     * @returns The `JsonDescribeInterface` representing the found parent `describe` block.
     *          If no matching parent is found, returns the suite's `rootDescribe`.
     *
     * @remarks
     * This method traverses the hierarchy of `describe` blocks in a suite using the
     * `ancestry` array, which contains the sequence of parent descriptions leading
     * to the target block. If the ancestry is empty, the suite's `rootDescribe` is returned.
     * If any ancestor in the path is not found, the method returns the `rootDescribe`
     * as a fallback. This ensures tests and nested `describe` blocks are always attached
     * to a valid parent.
     *
     * @example
     * ```ts
     * const parentDescribe = this.findParentDescribe(suite, ['Authentication tests', 'Login tests']);
     * parentDescribe.tests.push(newTestJson);
     * ```
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
