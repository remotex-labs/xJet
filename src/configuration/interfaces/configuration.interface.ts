/**
 * Import will remove at compile time
 */

import type { Options } from 'yargs';
import type { BuildOptions } from 'esbuild';
import type { LogLevel } from '@messages/constants/report.constant';

/**
 * Represents a test runner engine responsible for executing bundled test files.
 *
 * @remarks
 * A `TestRunnerInterface` abstracts the underlying JavaScript engine
 * that runs the test bundles produced by xJet.
 *
 * Its responsibilities include:
 * - Receiving a bundled test suite and executing it.
 * - Establishing a communication channel with xJet to stream results and test events.
 * - Handling timeouts, disconnections, and cleanup.
 *
 * Custom runners can be implemented to run tests in different environments
 * (e.g., Node.js, browser, Deno, or even remote workers).
 *
 * @since 1.0.0
 */

export interface TestRunnerInterface {
    /**
     * Optional unique identifier for this runner instance.
     *
     * If not provided, xJet will automatically generate and assign
     * a runner ID when the runner is registered.
     *
     * @since 1.0.0
     */

    id?: string;

    /**
     * Human-readable name of the test runner (e.g., `"NodeRunner"`, `"BrowserRunner"`).
     *
     * @since 1.0.0
     */

    name: string;

    /**
     * Maximum time (in milliseconds) allowed for establishing a connection
     * between xJet and the runner.
     *
     * @since 1.0.0
     */

    connectionTimeout?: number;

    /**
     * Maximum time (in milliseconds) allowed for a test suite execution.
     * @since 1.0.0
     */

    dispatchTimeout?: number;

    /**
     * Sends a compiled/bundled test suite to the runner for execution.
     *
     * @param suite - The compiled JavaScript test suite as a binary buffer.
     * @param suiteId - A unique identifier for the test suite.
     * @returns A promise that resolves once the suite has been successfully dispatched.
     *
     * @since 1.0.0
     */

    dispatch(suite: Buffer, suiteId: string): Promise<void> | void;

    /**
     * Establishes a communication channel with the runner to receive results.
     *
     * @param resolve - Callback invoked whenever the runner sends results back.
     * @param runnerId - A unique identifier for this runner instance.
     * @param argv - Optional arguments to pass throw the cli.
     *
     * @returns A promise that resolves once the connection is active.
     *
     * @since 1.0.0
     */

    connect(resolve: (data: Buffer) => void, runnerId: string, argv: Record<string, unknown>): Promise<void> | void;

    /**
     * Disconnects the runner and cleans up resources.
     *
     * @returns A promise that resolves once the disconnection is complete.
     *
     * @since 1.0.0
     */

    disconnect?(): Promise<void> | void;
}

/**
 * Defines the configuration options available for the xJet test runner.
 *
 * @remarks
 * The configuration controls test discovery, filtering, reporting, execution
 * behavior, and build options.
 *
 * @since 1.0.0
 */

export interface ConfigurationInterface {
    /**
     * Positional arguments passed to xJet that are not recognized as flags.
     * @since 1.0.0
     */

    _: Array<string>;

    /**
     * If `true`, stop running tests after the first failure.
     * @since 1.0.0
     */

    bail: boolean;

    /**
     * If `true`, watch files for changes and re-run tests automatically.
     * @since 1.0.0
     */

    watch: boolean;

    /**
     * Glob patterns or file paths used to discover test files.
     *
     * @example
     * ```ts
     * files: ["**\/*.test.ts", "**\/*.spec.ts", "src/specific/file.test.ts"]
     * ```
     *
     * @since 1.0.0
     */

    files: Array<string | RegExp>;

    /**
     * A subset of test files (by path or glob) selected from {@link files}.
     *
     * @remarks
     * - Supports glob syntax (e.g., `"tests/unit/**\/*.test.ts"`).
     * - Can also include explicit absolute or relative file paths.
     * - Entries must resolve to files already discovered in {@link files},
     *   or be parent directories of such files.
     * - Acts as a filter on top of {@link files}: only the matching files will run.
     * - If not set, all files from {@link files} will run.
     *
     * @example
     * ```ts
     * files: ["**\/*.test.ts"],
     * suites: ["tests/unit/**\/*.test.ts"] // runs only tests in `tests/unit`
     *
     * files: ["**\/*.test.ts"],
     * suites: ["tests/math/add.test.ts"] // runs only this file
     * ```
     *
     * @since 1.0.0
     */

    suites: Array<string>;

    /**
     * A list of test names (`it`, `test`) or suite names (`describe`) to run.
     *
     * @remarks
     * - If set, only the tests or suites listed here will be executed.
     * - If not set, all tests in the discovered files will run.
     *
     * @since 1.0.0
     */

    filter: Array<string>;

    /**
     * Logging verbosity level for test execution.
     *
     * @remarks
     * Determines which messages are shown during test runs.
     * Controlled via {@link LogLevel}, which includes levels such as
     * `Silent`, `Error`, `Warn`, `Info`, `Trace`, and `Debug`.
     *
     * This provides finer control than the `silent` flag,
     * allowing reporters or console output to show only the
     * desired level of detail.
     *
     * @since 1.0.0
     */

    logLevel: keyof typeof LogLevel;

    /**
     * Maximum time (in milliseconds) a single test can run before being marked as failed.
     * @since 1.0.0
     */

    timeout: number;

    /**
     * If true, include both xJet internal and native stack traces in error output.
     *
     * @remarks
     * - When `false`, stack traces are minimized to user code only.
     * - When `true`, full stack traces are printed, including internal frames.
     *
     * @since 1.0.0
     */

    verbose: boolean;

    /**
     * A list of files or patterns to exclude from the test run.
     *
     * @since 1.0.0
     */

    exclude: Array<string | RegExp>;

    /**
     * The reporter to use for test results.
     *
     * @remarks
     * - Accepts either a built-in reporter name or a path to a custom reporter module.
     * - Built-in reporters: `"spec"` (default), `"json"`, `"junit"`.
     * - If a file path is provided, it must resolve to a JavaScript module
     *   that exports a reporter implementation.
     *
     * @example
     * ```ts
     * reporter: "spec"              // Use a built-in spec reporter.
     * reporter: "json"              // Output results as JSON
     * reporter: "junit"             // Output results in JUnit XML format
     * reporter: "./my-reporter.ts"  // Use a custom reporter from a local file
     * ```
     *
     * @since 1.0.0
     */

    reporter: string | 'spec' | 'junit' | 'json';

    /**
     * Number of test files to run in parallel.
     * @since 1.0.0
     */

    parallel: number;

    /**
     * If `true`, randomize the order of test execution.
     * @since 1.0.0
     */

    randomize: boolean;

    /**
     * If `true`, omit stack traces entirely from error output.
     * @since 1.0.0
     */

    noStackTrace: boolean;

    /**
     * Optional list of custom test runners to use instead of the default Node.js runner.
     * @since 1.0.0
     */

    testRunners?: Array<TestRunnerInterface>;

    /**
     * Optional file path to write reporter output.
     *
     * @remarks
     * - If set, results will be printed to `stdout` and also written to this file.
     * - Useful for CI/CD pipelines that require machine-readable results
     *   (e.g., `junit.xml` or `results.json`).
     *
     * @example
     * ```ts
     * reporter: "junit",
     * outputFile: "reports/junit.xml"
     * ```
     *
     * @since 1.1.0
     */

    outputFile?: string;

    /**
     * Optional object containing user-defined CLI options parsed by `yargs`.
     *
     * @remarks
     * - This allows users to define custom CLI options dynamically at runtime.
     * - Keys are option names, values are typed according to `yargs` parsing rules.
     * - Supports strings, numbers, booleans, arrays, and nested options.
     *
     * @example
     * ```ts
     * userArgv: {
     *   host: "localhost",
     *   port: 8080,
     *   debug: true
     * }
     * ```
     *
     * @since 1.0.0
     */

    userArgv?: Record<string, Options>;

    /**
     * Build configuration applied when transpiling or bundling test files.
     * @since 1.0.0
     */

    build: {
        /**
         * ECMAScript target(s) for build output (e.g., `"esnext"`, `"es2019"`).
         * @since 1.0.0
         */

        target?: BuildOptions['target'];

        /**
         * External dependencies to exclude from the test bundle.
         * @since 1.0.0
         */

        external?: BuildOptions['external'];

        /**
         * Platform target for execution:
         * - `"browser"`
         * - `"node"`
         * - `"neutral"`
         *
         * @since 1.0.0
         */

        platform?: BuildOptions['platform'];

        /**
         * Defines how packages are resolved:
         * - `"bundle"` → include them in the output bundle
         * - `"external"` → require them at runtime
         *
         * @since 1.0.0
         */

        packages?: BuildOptions['packages'];
    };
}

/**
 * Represents a configuration object specific to xJet, allowing for partial and deeply nested properties to be defined.
 *
 * This type is a partial deep version of the `ConfigurationInterface`, enabling flexible configuration by only requiring
 * the properties that need to be customized, while other properties can take their default values.
 *
 * @remarks
 * The `xJetConfig` type is useful when working with extensive configuration objects where only a subset of properties
 * needs to be overridden. It enables better maintainability and cleaner code by avoiding the need to specify the entire
 * structure of the `ConfigurationInterface`.
 *
 * @see ConfigurationInterface
 *
 * @since 1.0.0
 */

export type xJetConfig = Partial<ConfigurationInterface>;
