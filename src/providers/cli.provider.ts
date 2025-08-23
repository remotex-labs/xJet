/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { CliOptionsInterface } from '@providers/interfaces/cli-provider.interface';

/**
 * Imports
 */

import yargs from 'yargs';
import { resolve } from 'path';
import { hideBin } from 'yargs/helpers';
import { bannerComponent } from '@components/banner.component';

/**
 * Parses command-line arguments for the xJet test runner.
 *
 * @param argv - Array of command-line arguments (usually `process.argv`).
 * @returns Parsed CLI options conforming to {@link CliOptionsInterface}.
 *
 * @remarks
 * This function sets up yargs to handle xJet CLI options, including
 * - Discovering test files via `files` glob patterns.
 * - Filtering specific suites via `suites` (supports glob syntax).
 * - Filtering individual tests or describes via `filter`.
 * - Loading a configuration file via `--config`.
 * - Specifying reporter output with `reporter` (built-in: "spec", "json", "junit") or a custom module.
 * - Optionally writing reporter output to a file with `outputFile`.
 * - Verbose and silent logging controls.
 * - Timeout, bail, watch, and randomization options.
 * - Displaying the xJet banner.
 *
 * The evaluation order for selecting tests is:
 * 1. `files` → collects all test files matching patterns.
 * 2. `suites` → filters `files` by suite patterns (supports globs).
 * 3. `filter` → filters tests/describes by name.
 *
 * The `showHelp` function is overridden to always print the xJet banner.
 *
 * @example
 * ```ts
 * import { parseArguments } from '@cli/parse-arguments';
 * const options = parseArguments(process.argv);
 * console.log(options.files, options.suites, options.filter);
 * ```
 *
 * @since 1.0.0
 */

export function parseArguments(argv: Array<string>): CliOptionsInterface {
    const parser = yargs(hideBin(argv));
    const originalShowHelp = parser.showHelp;
    parser.showHelp = function (consoleFunction?: string | ((s: string) => void)):  Argv<unknown> {
        console.log(bannerComponent());

        return originalShowHelp.call(this, <(s: string) => void> consoleFunction);
    };

    const cli = parser
        .usage('Usage: xJet [options]')
        .parserConfiguration({ 'unknown-options-as-args': true })
        .options({
            files: {
                describe: 'Glob patterns or file paths used to discover test files',
                type: 'string',
                array: true
            },
            suites: {
                alias: 's',
                describe: 'Filter pattern for test suite files. Only matching files from `files` will run.',
                type: 'string',
                array: true
            },
            filter: {
                alias: 'f',
                describe: 'Run only tests or suites matching these names',
                type: 'string',
                array: true
            },
            config: {
                alias: 'c',
                describe: 'Path to xJet configuration file (.ts or .js)',
                type: 'string',
                default: 'xJet/xjet.config.ts',
                normalize: true,
                coerce: (value) => resolve(value)
            },
            reporter: {
                alias: 'r',
                describe: 'Reporter for test results. Built-in: "spec", "json", "junit". Can also be a custom module path.',
                type: 'string'
            },
            outputFile: {
                describe: 'Optional file path to write reporter output (e.g., "reports/junit.xml")',
                type: 'string'
            },
            verbose: {
                alias: 'v',
                describe: 'Include full stack traces, including internal frames',
                type: 'boolean'
            },
            silent: {
                describe: 'Suppress all console output from tests',
                type: 'boolean'
            },
            timeout: {
                alias: 't',
                describe: 'Maximum time (ms) a single test can run before failing',
                type: 'number'
            },
            bail: {
                alias: 'b',
                describe: 'Stop running tests after the first failure',
                type: 'boolean'
            },
            watch: {
                alias: 'w',
                describe: 'Watch files for changes and re-run tests automatically',
                type: 'boolean'
            },
            randomize: {
                describe: 'Randomize the order of test execution',
                type: 'boolean'
            }
        })
        .example('xJet --config ./xjet.config.ts', 'Run tests with custom configuration')
        .example('xJet --filter "auth.*" --verbose', 'Run auth-related tests with verbose logging')
        .example('xJet --suites "src/**/*.test.ts"', 'Run specific test suites')
        .example('xJet --files "src/**/*.test.ts"', 'Run pateran to collect test file')
        .example('xJet --watch --coverage', 'Run tests in watch mode with coverage')
        .epilogue('For more information, check the documentation')
        .help()
        .alias('help', 'h')
        .version()
        .parseSync();

    return <CliOptionsInterface> cli;
}
