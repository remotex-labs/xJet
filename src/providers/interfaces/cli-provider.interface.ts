/**
 * Represents the parsed command-line options passed to xJet.
 *
 * @remarks
 * These options are derived from CLI arguments, typically parsed by
 * {@link parseArguments}. They control test discovery, filtering,
 * execution behavior, reporting, verbosity, and other runtime settings.
 *
 * @since 1.0.0
 */

export interface CliOptionsInterface {
    /**
     * Positional arguments passed to xJet that are not recognized as flags.
     * @since 1.0.0
     */

    _: Array<string>;

    /**
     * If true, stop running tests after the first failure.
     * @since 1.0.0
     */

    bail?: boolean;

    /**
     * If true, watch files for changes and automatically re-run tests.
     * @since 1.0.0
     */

    watch?: boolean;

    /**
     * Glob patterns or file paths used to discover test files.
     *
     * @remarks
     * Supports typical glob syntax (e.g., `'**\/*.test.ts'`) and absolute
    * or relative file paths. Used as the primary source for test file collection.
    *
    * @since 1.0.0
    */

    files?: Array<string>;

    /**
     * If true, suppress all console output from tests.
     * @since 1.0.0
     */

    silent?: boolean;

    /**
     * Filter pattern(s) for test suite files (supports glob).
     *
     * @remarks
     * Only files collected via `files` that match these patterns will be executed.
     * If not set, all files discovered by `files` will run.
     *
     * @since 1.0.0
     */

    suites?: Array<string>;

    /**
     * Path to the xJet configuration file (.ts or .js).
     *
     * @remarks
     * If not provided, defaults to `'xjet.config.ts'`.
     *
     * @since 1.0.0
     */

    config?: string;

    /**
     * Filter test names or describe blocks to execute.
     *
     * @remarks
     * Only tests or describes matching one of these strings will run.
     * Supports regular expression-like patterns.
     *
     * @since 1.0.0
     */

    filter?: Array<string>;

    /**
     * If true, include full stack traces, including internal frames.
     *
     * @remarks
     * When `verbose` is false, stack traces are minimized to user code only.
     * When true, stack traces include xJet internal frames and native frames.
     *
     * @since 1.0.0
     */

    verbose?: boolean;

    /**
     * Maximum time (in milliseconds) a single test can run before being marked as failed.
     * @since 1.0.0
     */

    timeout?: number;

    /**
     * Reporter for test results.
     *
     * @remarks
     * Built-in options: `"spec"`, `"json"`, `"junit"`. Can also be a
     * path to a custom reporter module.
     *
     * @since 1.0.0
     */

    reporter?: string;

    /**
     * If true, randomize the order of test execution.
     * @since 1.0.0
     */

    randomize?: boolean;

    /**
     * Optional file path to write the reporter output.
     *
     * @remarks
     * If specified, the reporter output (JSON, JUnit XML)
     * will be written to this file in addition to being printed to stdout.
     *
     * @since 1.0.0
     */

    outputFile?: string;
}
