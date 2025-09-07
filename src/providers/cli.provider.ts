/**
 * Import will remove at compile time
 */

import type { Argv, Options } from 'yargs';
import type { CliOptionsInterface } from '@providers/interfaces/cli-provider.interface';

/**
 * Imports
 */

import yargs from 'yargs';
import { resolve } from 'path';
import { hideBin } from 'yargs/helpers';
import { bannerComponent } from '@components/banner.component';
import { configuration } from '@providers/configuration.provider';

/**
 * Default path to the xJet configuration file.
 *
 * @remarks
 * - Used as the fallback configuration file if the user does not specify `--config`.
 * - Can be overridden by CLI argument `--config` or `-c`.
 *
 * @example
 * ```ts
 * import { DEFAULT_CONFIG_PATH } from '@cli/parse-arguments';
 * console.log(DEFAULT_CONFIG_PATH); // 'xJet/xjet.config.ts'
 * ```
 *
 * @since 1.0.0
 */

const DEFAULT_CONFIG_PATH = 'xJet/config.xjet.ts';

/**
 * Default command-line options for the xJet test runner.
 *
 * @remarks
 * Provides the baseline configuration for parsing CLI arguments using `yargs`.
 * Each property maps to a CLI flag, with type, aliases, and description.
 *
 * @since 1.0.0
 */

const DEFAULT_CLI_OPTIONS = {
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
        default: DEFAULT_CONFIG_PATH,
        normalize: true,
        coerce: (value: string) => resolve(value)
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
} as const;

/**
 * Predefined command usage examples for xJet CLI.
 *
 * @remarks
 * Each tuple contains:
 * - The CLI command string.
 * - A short description of what the command does.
 *
 * These examples are used to populate the help output (`--help`) of the CLI.
 *
 * @example
 * ```bash
 * xJet --config ./xjet.config.ts          # Run tests with custom configuration
 * xJet --filter "auth.*" --verbose        # Run auth-related tests with verbose logging
 * xJet --suites "src/**\/*.test.ts"       # Run specific test suites
 * xJet --files "src/**\/*.test.ts"        # Run a pattern to collect test files
 * xJet --watch --coverage                 # Run tests in watch mode with coverage
 * ```
 *
 * @since 1.0.0
 */

const USAGE_EXAMPLES = [
    [ 'xJet --config ./xjet.config.ts', 'Run tests with custom configuration' ],
    [ 'xJet --filter "auth.*" --verbose', 'Run auth-related tests with verbose logging' ],
    [ 'xJet --suites "src/**/*.test.ts"', 'Run specific test suites' ],
    [ 'xJet --files "src/**/*.test.ts"', 'Run pattern to collect test files' ],
    [ 'xJet --watch --coverage', 'Run tests in watch mode with coverage' ]
] as const;

/**
 * Reads user-defined CLI options from the xJet configuration file.
 *
 * @remarks
 * - Parses only the `--config` option to locate the user configuration file.
 * - Loads the configuration via {@link configuration} and extracts `userArgv`.
 * - Returns an empty object if no user CLI options are defined.
 *
 * @returns A promise resolving to a record of CLI options conforming to {@link Options}.
 *
 * @example
 * ```ts
 * const userOptions = await getUserArgv();
 * console.log(userOptions.files, userOptions.suites);
 * ```
 *
 * @since 1.0.0
 */

export async function getUserArgv(): Promise<Record<string, Options>> {
    const argv = yargs(process.argv).options({
        config: DEFAULT_CLI_OPTIONS.config
    }).parseSync();

    return (await configuration(argv.config, argv as CliOptionsInterface)).userArgv ?? {};
}

/**
 * Parses command-line arguments for the xJet test runner.
 *
 * @param argv - Array of command-line arguments (typically `process.argv`).
 * @returns A promise resolving to {@link CliOptionsInterface} with fully parsed CLI options.
 *
 * @remarks
 * - Combines default CLI options (`DEFAULT_CLI_OPTIONS`) with user-defined options from {@link getUserArgv}.
 * - Overrides `showHelp` to display the xJet banner via {@link bannerComponent}.
 * - Supports glob patterns for `files` and `suites`, test filtering via `filter`, and custom reporters (`reporter` and `outputFile`).
 * - Supports execution flags: `verbose`, `silent`, `timeout`, `bail`, `watch`, `randomize`.
 * - Evaluation order for test selection:
 *   1. `files` → collect all test files matching patterns.
 *   2. `suites` → filter files by suite patterns.
 *   3. `filter` → filter individual tests or describes by name.
 * - Automatically registers usage examples defined in {@link USAGE_EXAMPLES}.
 *
 * @example
 * ```ts
 * import { parseArguments } from '@cli/parse-arguments';
 * const options = await parseArguments(process.argv);
 * console.log(options.files, options.suites, options.filter);
 * ```
 *
 * @see {@link getUserArgv} for loading user-defined CLI options from the configuration file.
 * @see {@link CliOptionsInterface} for the shape of returned options.
 *
 * @since 1.0.0
 */

export async function parseArguments(argv: Array<string>): Promise<CliOptionsInterface> {
    const userOptions = await getUserArgv();

    const parser = yargs(hideBin(argv));
    const originalShowHelp = parser.showHelp;
    parser.showHelp = function (consoleFunction?: string | ((s: string) => void)): Argv<unknown> {
        console.log(bannerComponent());
        this.group(Object.keys(DEFAULT_CLI_OPTIONS), 'xJet Options:');
        this.group(Object.keys(userOptions), 'user Options:');

        return originalShowHelp.call(this, consoleFunction as (s: string) => void);
    };

    const cli = parser
        .usage('Usage: xJet [files..] [options]')
        .command('* [files..]', 'Specific test files to run (supports glob patterns)', (yargs) => {
            return yargs.positional('files', {
                describe: 'Specific test files to run (supports glob patterns)',
                type: 'string',
                array: true
            });
        })
        .options(userOptions)
        .options(DEFAULT_CLI_OPTIONS)
        .epilogue('For more information, check the documentation')
        .help()
        .alias('help', 'h')
        .strict()
        .version();

    USAGE_EXAMPLES.forEach(([ command, description ]) => {
        cli.example(command, description);
    });

    return cli.parseSync() as CliOptionsInterface;
}

