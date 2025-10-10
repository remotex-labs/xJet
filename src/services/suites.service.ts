/**
 * Import will remove at compile time
 */

import type { AbstractTarget } from '@targets/abstract/target.abstract';
import type { TranspileFileType } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { join } from 'path';
import { exit } from 'process';
import { WatchService } from '@services/watch.service';
import { getSpecFiles } from '@providers/specs.provider';
import { inject } from '@symlinks/services/inject.service';
import { xterm } from '@remotex-labs/xansi/xterm.component';
import { transpileFiles } from '@services/transpiler.service';
import { FrameworkService } from '@services/framework.service';
import { getReporter } from '@messages/services/reports.service';
import { MessageService } from '@messages/services/message.service';
import { ExternalService, LocalService } from '@targets/target.module';

/**
 * Code banner injected at the top of transpiled JavaScript files.
 *
 * @remarks
 * This is passed to the transpiler (esbuild) to ensure a clean newline
 * at the start of each bundled file. It can also be extended later to
 * include configuration headers, metadata, or runtime bootstrap code.
 *
 * @since 1.0.0
 */

const banner = {
    js: '\n'
};

/**
 * Code footer injected at the bottom of transpiled JavaScript files.
 *
 * @remarks
 * Ensures that once the suite code is fully bundled and loaded,
 * the `state.run({})` function is invoked to start the test execution lifecycle.
 *
 * @since 1.0.0
 */

const footer = {
    js: 'state.run({})'
};

/**
 * Service responsible for executing, transpiling, and managing test suites.
 *
 * @remarks
 * The `SuitesService` class handles the lifecycle of test execution:
 * - Locating and transpiling spec files.
 * - Initializing the target environment (local or external).
 * - Managing reporters and error states.
 * - Optionally watching for changes and re-running tests.
 *
 * It uses injected services like {@link FrameworkService}, {@link MessageService},
 * and target services ({@link LocalService} / {@link ExternalService}) to orchestrate the process.
 *
 * @example
 * ```ts
 * const service = new SuitesService(config);
 * await service.executeSuites();
 * ```
 *
 * @since 1.0.0
 */

export class SuitesService {
    /**
     * Reference to the currently active test target.
     *
     * @remarks
     * This property is initialized once during construction
     * and cannot be reassigned afterward due to the `readonly` modifier.
     * It resolves to either a `LocalService` or `ExternalService`,
     * both of which extend the abstract target contract (`AbstractTarget`).
     *
     * @since 1.0.0
     */

    private readonly target: AbstractTarget;

    /**
     * Instance of the {@link FrameworkService} injected via the DI container.
     *
     * @remarks
     * This property is resolved once during class instantiation and cannot
     * be reassigned due to the `readonly` modifier. It provides access to
     * framework-level paths, configuration, and shared utilities.
     *
     * @since 1.0.0
     */

    private readonly framework = inject(FrameworkService);

    /**
     * Creates an instance of {@link SuitesService}.
     *
     * @param config - The runtime configuration object that defines
     *                 suite files, build options, runners, and other
     *                 execution parameters.
     *
     * @remarks
     * The constructor initializes the {@link target} by invoking
     * {@link SuitesService.createTarget | createTarget}, ensuring the
     * appropriate execution environment (local or external) is selected
     * based on the provided configuration.
     *
     * @since 1.0.0
     */

    constructor(private config: ConfigurationInterface) {
        this.target = this.createTarget();
    }

    /**
     * Executes all discovered test suites based on the current configuration.
     *
     * @remarks
     * This method orchestrates the end-to-end lifecycle of test execution:
     *
     * - Discovers suite files using {@link getSpecFiles}.
     * - Validates that test files are available, throwing an error if none are found.
     * - Initializes the configured {@link AbstractTarget}, such as a local or external runner.
     * - Creates a {@link MessageService} with the selected reporter to handle
     *   event reporting and error tracking.
     * - Transpiles and executes suites via {@link SuitesService.exec}.
     * - Optionally watches for file changes when `watch` mode is enabled.
     * - Frees target resources after execution completes.
     * - Terminates the process with exit codes depending on test outcomes:
     *   - `0` if all suites passed.
     *   - `1` if any test error occurred.
     *   - `2` if any suite-level error occurred.
     *
     * @throws Error If no test files matching the configuration are found.
     *
     * @example
     * ```ts
     * const service = new SuitesService(config);
     * await service.executeSuites();
     * ```
     *
     * @since 1.0.0
     */

    async executeSuites(): Promise<void> {
        const specsFiles = getSpecFiles(this.framework.rootPath, this.config);
        if (Object.keys(specsFiles).length === 0) {
            if(this.config.suites.length > 0)
                throw xterm.redBright('No test files found for ') + xterm.greenBright(this.config.suites.join(', '));

            throw xterm.redBright('No test files found for ') + xterm.greenBright(this.config.files.join(', '));
        }

        await this.target.initTarget?.();
        const message = new MessageService(this.target, await getReporter(this.config));
        await this.exec(message, specsFiles);

        if (this.config.watch) {
            await this.watchForChanges(message, specsFiles);
        }

        await this.target.freeTarget?.();

        if (message.hasError) exit(1);
        if (message.hasSuiteError) exit(2);
        exit(0);
    }

    /**
     * Executes a single run of the provided test suites.
     *
     * @remarks
     * This method performs the following tasks in sequence:
     * - Initializes the reporter with discovered suite file paths and available runners.
     * - Transpiles the test suite files into executable format.
     * - Delegates execution to the configured {@link AbstractTarget}.
     * - Finalizes reporting by calling the reporter’s `finish` method.
     *
     * @param message - The {@link MessageService} instance responsible for reporting
     *                  events and aggregating errors during execution.
     * @param specsFiles - A record mapping suite identifiers to their file system paths.
     *
     * @example
     * ```ts
     * const message = new MessageService(target, reporter);
     * await this.exec(message, { 'suite1': '/path/to/suite1.spec.ts' });
     * ```
     *
     * @since 1.0.0
     */

    private async exec(message: MessageService, specsFiles: Record<string, string>): Promise<void> {
        message.reporter.init?.(Object.values(specsFiles), message.target.getRunners());
        const transpiled = await this.transpileSuites(specsFiles);
        await this.target.executeSuites(transpiled, specsFiles);
        message.reporter.finish?.();
    }

    /**
     * Creates and returns the appropriate test execution target.
     *
     * @remarks
     * This method determines whether to use an {@link ExternalService}
     * or {@link LocalService} as the execution target based on the presence
     * of configured test runners in {@link ConfigurationInterface.testRunners}.
     *
     * - If one or more `testRunners` are specified, an {@link ExternalService} is injected.
     * - Otherwise, a {@link LocalService} is injected.
     *
     * @returns An {@link AbstractTarget} instance configured according to the current setup.
     *
     * @example
     * ```ts
     * const target = this.createTarget();
     * await target.initTarget?.();
     * ```
     *
     * @see AbstractTarget
     * @see ExternalService
     * @see LocalService
     *
     * @since 1.0.0
     */

    private createTarget(): AbstractTarget {
        return (this.config.testRunners && this.config.testRunners.length > 0)
            ? inject(ExternalService, this.config)
            : inject(LocalService, this.config);
    }

    /**
     * Initializes a watch mode to monitor test files for changes.
     *
     * @remarks
     * This method sets up a {@link WatchService} that observes the provided
     * test specification files (`specsFiles`).
     * When a change is detected, the suite execution is re-triggered
     * using the {@link SuitesService.exec | exec} method bound to the given {@link MessageService}.
     *
     * This enables continuous testing in development environments when
     * the `watch` option is enabled in {@link ConfigurationInterface}.
     *
     * @param message - The active {@link MessageService} used for reporting
     *                  and coordinating suite execution.
     * @param specsFiles - A record of spec file identifiers mapped to their file paths.
     *
     * @returns A `Promise` that resolves when the {@link WatchService} is fully initialized.
     *
     * @example
     * ```ts
     * if (this.config.watch) {
     *   await this.watchForChanges(message, specsFiles);
     * }
     * ```
     *
     * @see WatchService
     * @see SuitesService.exec
     *
     * @since 1.0.0
     */

    private async watchForChanges(message: MessageService, specsFiles: Record<string, string>): Promise<void> {
        const watcher = new WatchService(this.config, specsFiles, this.exec.bind(this, message));
        await watcher.init();
    }

    /**
     * Transpiles the given test specification files according to the configured build options.
     *
     * @remarks
     * This method uses {@link transpileFiles} to process the test files, applying
     * the build configuration from {@link ConfigurationInterface.build}.
     * It automatically injects shared dependencies, applies a banner and footer, and
     * enforces the CommonJS module format (`cjs`).
     * Minification is disabled, but syntax and whitespace optimizations are applied.
     *
     * @param filePaths - A record mapping identifiers to the absolute paths of the test files
     *                    that need to be transpiled.
     *
     * @returns A `Promise` resolving to a {@link TranspileFileType} object containing
     *          the transpiled outputs.
     *
     * @example
     * ```ts
     * const transpiled = await this.transpileSuites({
     *   'example.test.ts': '/path/to/example.test.ts'
     * });
     * ```
     *
     * @see transpileFiles
     * @see ConfigurationInterface.build
     *
     * @since 1.0.0
     */

    private async transpileSuites(filePaths: Record<string, string>): Promise<TranspileFileType> {
        return await transpileFiles(filePaths, {
            ...this.config.build,
            banner,
            footer,
            format: 'cjs',
            minify: false,
            inject: [ join(this.framework.distPath, 'shared.js') ],
            logLevel: 'silent',
            sourcemap: true,
            minifySyntax: true,
            preserveSymlinks: true,
            minifyWhitespace: true,
            minifyIdentifiers: false,
            define: {
                'import.meta': 'import_meta'
            }
        });
    }
}
