/**
 * Import will remove at compile time
 */

import type { TranspileFileType } from '@services/interfaces/transpiler-service.interface';
import type { TestRunnerInterface } from '@configuration/interfaces/configuration.interface';
import type { RunnerInterface, RuntimeConfigInterface } from '@targets/interfaces/traget.interface';

/**
 * Imports
 */
import yargs from 'yargs';
import { dirname, relative } from 'path';
import { xJetError } from '@errors/xjet.error';
import { serializeError } from '@remotex-labs/xjet-expect';
import { withTimeout } from '@components/timeout.component';
import { Injectable } from '@symlinks/services/inject.service';
import { AbstractTarget } from '@targets/abstract/target.abstract';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Implementation of a test execution target that runs tests in external runners.
 *
 * @remarks
 * The `ExternalService` coordinates test execution across external processes or environments.
 * It connects to configured test runners, dispatches test code, and manages their lifecycle:
 * initialization (`initTarget`), execution (`executeSuites`), and cleanup (`freeTarget`).
 *
 * Unlike {@link LocalService}, which runs tests in a local sandbox, this class offloads execution
 * to one or more external runners (e.g., browser, VM, or remote environment).
 *
 * @example
 * ```ts
 * const config = {
 *   testRunners: [
 *     { name: 'chrome', connection: connectChromeRunner, connectionTimeout: 5000 }
 *   ]
 * };
 *
 * const externalTarget = new ExternalService(config);
 * await externalTarget.initTarget();
 * await externalTarget.executeSuites(transpileFiles, originalFiles);
 * await externalTarget.freeTarget();
 * ```
 *
 * @see LocalService
 * @see AbstractTarget
 * @see TestRunnerInterface
 *
 * @since 1.0.0
 */

@Injectable({
    scope: 'singleton'
})
export class ExternalService extends AbstractTarget {
    /**
     * A map of all registered test runners.
     *
     * @remarks
     * The key is the unique runner ID (generated internally), and the value is
     * the corresponding `TestRunnerInterface` instance. This map tracks all
     * runners connected to this target and is used to dispatch test suites
     * during execution.
     *
     * @example
     * ```ts
     * for (const [id, runner] of externalService.runners) {
     *   console.log(`Runner ${runner.name} has ID: ${id}`);
     * }
     * ```
     *
     * @since 1.0.0
     */

    readonly runners: Map<string, TestRunnerInterface> = new Map();

    /**
     * Initializes all configured external test runners.
     *
     * @throws xJetError - If no test runners are configured.
     *
     * @remarks
     * This method sets up the target environment by connecting to each test runner
     * defined in the configuration (`this.config.testRunners`). It also parses
     * optional CLI arguments provided via `this.config.userArgv` using `yargs`.
     *
     * All runner connections are initiated concurrently using `Promise.allSettled`
     * to ensure the target attempts to connect to every runner, even if some fail.
     *
     * @example
     * ```ts
     * await externalService.initTarget();
     * // All configured runners are now connected and ready to execute suites
     * ```
     *
     * @since 1.0.0
     */

    async initTarget(): Promise<void> {
        if (!this.config.testRunners || this.config.testRunners.length === 0)
            throw new xJetError('No test runners configured');

        let argv: Record<string, unknown> = {};
        if (this.config.userArgv) {
            argv = yargs(process.argv.slice(2))
                .options(this.config.userArgv)
                .parseSync();
        }

        await Promise.all(
            this.config.testRunners.map(runner => this.connectRunner(runner, argv))
        );
    }

    /**
     * Frees all resources associated with the target.
     *
     * @remarks
     * This method disconnects all registered test runners by calling their
     * `disconnect` method (if available). It is intended to be called when the
     * target is no longer needed, ensuring a clean shutdown and preventing
     * resource leaks.
     *
     * Disconnections are performed concurrently using `Promise.allSettled` so
     * that all runners are attempted even if some fail to disconnect.
     *
     * @example
     * ```ts
     * await externalService.freeTarget();
     * // All connected runners are now disconnected
     * ```
     *
     * @see {@link initTarget} to initialize runners before execution.
     * @see {@link executeSuites} for running suites on the connected runners.
     *
     * @since 1.0.0
     */

    async freeTarget(): Promise<void> {
        const disconnectionPromises = [];
        const runners = Array.from(this.runners.values());

        for (let i = 0; i < runners.length; i++) {
            const runner = runners[i];
            if (runner?.disconnect) {
                disconnectionPromises.push(runner?.disconnect?.());
            }
        }

        await Promise.allSettled(disconnectionPromises);
    }

    /**
     * Returns the name of a registered runner given its ID.
     *
     * @param runnerId - The unique ID of the runner.
     * @returns The name of the runner associated with the given ID.
     *
     * @throws xJetError - If no runner with the specified ID exists.
     *
     * @remarks
     * The `runnerId` corresponds to the internally generated ID assigned
     * to each runner when it was connected via `initTarget`.
     *
     * @example
     * ```ts
     * const runnerName = externalService.getRunnerName('runner-123');
     * console.log(runnerName); // e.g., "chrome"
     * ```
     *
     * @since 1.0.0
     */

    getRunnerName(runnerId: string): string {
        const name = this.runners.get(runnerId)?.name;
        if (!name) {
            throw new xJetError(`Runner with ID "${ runnerId }" not found`);
        }

        return name;
    }

    /**
     * Returns a list of all registered runners with their IDs and names.
     *
     * @returns An array of objects each containing:
     * - `id`: The unique runner ID.
     * - `name`: The runner's name.
     *
     * @remarks
     * This method provides a simplified view of all connected runners without exposing
     * the full `TestRunnerInterface` details. It is useful for reporting or UI purposes.
     *
     * @example
     * ```ts
     * const runners = externalService.getRunners();
     * runners.forEach(runner => {
     *   console.log(`Runner ID: ${runner.id}, Name: ${runner.name}`);
     * });
     * ```
     *
     * @since 1.0.0
     */

    getRunners(): Array<RunnerInterface> {
        return Array.from(this.runners.values()).map(runner => ({
            id: runner.id!,
            name: runner.name
        }));
    }

    /**
     * Executes the provided transpiled test suites on all registered runners.
     *
     * @param transpileSuites - An array of transpiled test files to execute.
     * @param suites - A record mapping original suite names to their file paths.
     *
     * @remarks
     * This method registers the provided suites internally via `setSuites` and
     * queues each transpiled suite for execution on every connected runner.
     *
     * Each suite is executed asynchronously, and errors are handled internally
     * without halting the execution of other suites.
     *
     * The `queue` ensures that execution tasks are managed per runner, preventing
     * race conditions and allowing controlled concurrency.
     *
     * After all tasks are queued, the queue is started and the method waits
     * for all execution tasks to settle using `Promise.allSettled`.
     *
     * @example
     * ```ts
     * await externalService.executeSuites(transpileFiles, originalFiles);
     * ```
     *
     * @see {@link setSuites} to register suites for execution.
     * @see {@link executeTestWithErrorHandling} for individual test execution logic.
     *
     * @since 1.0.0
     */

    async executeSuites(transpileSuites: TranspileFileType, suites: Record<string, string>): Promise<void> {
        this.setSuites(suites);
        const testExecutionTasks: Array<Promise<void>> = [];

        for (const transpile of transpileSuites) {
            const relativePath = relative(this.framework.rootPath, transpile.path)
                .replace(/\.[^/.]+$/, '');

            this.runners.forEach((runner: TestRunnerInterface, id: string) => {
                testExecutionTasks.push(this.queue.enqueue(async () => {
                    return this.executeTestWithErrorHandling(transpile.code, relativePath, runner);
                }, id));
            });
        }

        this.queue.start();
        await Promise.allSettled(testExecutionTasks);
    }

    /**
     * Connects a single test runner and registers it in the internal map.
     *
     * @param runner - The test runner configuration to connect.
     * @param argv - Optional CLI arguments to pass to the runner during connection.
     *
     * @remarks
     * A unique ID is generated for the runner and assigned to `runner.id`.
     * The runner's `connection` method is called with a dispatch function, its ID,
     * and any provided arguments. The connection attempt is wrapped in a timeout
     * using `withTimeout` (defaulting to 5000 ms if `runner.connectionTimeout` is not set).
     *
     * If the connection succeeds, the runner is added to the `runners` map. If it fails,
     * the error is caught and logged as a `VMRuntimeError` without throwing,
     * allowing other runners to continue connecting.
     *
     * @example
     * ```ts
     * await this.connectRunner(runnerConfig, { verbose: true });
     * ```
     *
     * @since 1.0.0
     */

    private async connectRunner(runner: TestRunnerInterface, argv: Record<string, unknown>): Promise<void> {
        runner.id = this.generateId();
        await withTimeout(
            runner.connect(this.dispatch.bind(this), runner.id!, argv),
            runner?.connectionTimeout ?? 5000,
            `connection of runner "${ runner.name }"`
        );

        this.runners.set(runner.id, runner);
    }

    /**
     * Executes a single test suite on a runner with error handling.
     *
     * @param testCode - The transpiled test code to execute.
     * @param relativePath - The relative path of the test file, used to look up the suite ID.
     * @param runner - The test runner instance that will execute the suite.
     *
     * @returns A `Promise` that resolves when the suite has been executed or fails gracefully.
     *
     * @remarks
     * This method wraps the execution of a test suite in a `Promise` and tracks
     * it in the `runningSuites` map using the suite ID. If `executeInRunner`
     * throws an error, the suite is marked as complete with failure, and an
     * 'error' event is emitted via the `eventEmitter`.
     *
     * The emitted error includes:
     * - `kind`: The packet type (`PacketKind.Error`)
     * - `error`: The serialized error object
     * - `suiteId`: The unique ID of the suite
     * - `runnerId`: The ID of the runner that executed the suite
     *
     * @example
     * ```ts
     * await this.executeTestWithErrorHandling(testCode, "tests/login.spec.ts", runner);
     * ```
     *
     * @since 1.0.0
     */

    private executeTestWithErrorHandling(testCode: string, relativePath: string, runner: TestRunnerInterface): Promise<void> {
        const suiteId = this.suites.get(relativePath)!;

        return new Promise<void>(async (resolve, reject) => {
            try {
                this.runningSuites.set(runner.id + suiteId, { resolve, reject });
                await this.executeInRunner(testCode, suiteId, runner);
            } catch (error) {
                this.completeSuite(runner.id + suiteId, true);
                this.eventEmitter.emit('error', {
                    kind: PacketKind.Error,
                    error: JSON.stringify(serializeError(error)),
                    suiteId: suiteId,
                    runnerId: runner.id,
                    timestamp: new Date()
                }, this.suites.get(suiteId)!);
            }
        });
    }

    /**
     * Dispatches a test suite to a runner with an injected runtime context.
     *
     * @param testCode - The transpiled test code to execute.
     * @param suiteId - The unique ID of the suite.
     * @param runner - The test runner instance that will execute the suite.
     *
     * @throws Throws a timeout error if the runner's dispatch does not complete in time.
     *
     * @remarks
     * This method prepares the test code by injecting runtime context (bail, path, filter,
     * timeout, suiteId, runnerId, randomization) using `prepareTestCodeWithContext`.
     * The prepared code is then dispatched to the runner via its `dispatch` method,
     * wrapped in a timeout using `withTimeout` (defaulting to 5000 ms if `runner.dispatchTimeout` is not set).
     *
     * The `suiteId` is used both for looking up the original file path in `suites` and for
     * identifying the suite during dispatch.
     *
     * @example
     * ```ts
     * await this.executeInRunner(testCode, suiteId, runner);
     * ```
     *
     * @since 1.0.0
     */

    private async executeInRunner(testCode: string, suiteId: string, runner: TestRunnerInterface): Promise<void> {
        const runtimeContext: Record<string, RuntimeConfigInterface> = {
            runtime: {
                bail: this.config.bail,
                path: this.suites.get(suiteId)!,
                filter: this.config.filter,
                timeout: this.config.timeout,
                suiteId: suiteId,
                runnerId: runner.id!,
                randomize: this.config.randomize
            }
        };

        const preparedTestCode = this.prepareTestCodeWithContext(testCode, runtimeContext);
        await withTimeout(
            runner?.dispatch?.(Buffer.from(preparedTestCode), suiteId),
            runner?.dispatchTimeout ?? 5000,
            `dispatch of runner "${ runner.name }"`
        );
    }

    /**
     * Injects a runtime context into the test code.
     *
     * @param testCode - The original transpiled test code.
     * @param context - The runtime context to inject, including configuration and suite/runner metadata.
     *
     * @returns A string containing the test code with the injected `__XJET` context variable.
     *
     * @remarks
     * This method prepends the test code with a `const __XJET` declaration containing
     * the provided context. The runner can access this context during execution to
     * determine runtime options like `bail`, `timeout`, `suiteId`, `runnerId`, etc.
     *
     * The resulting code is suitable for direct dispatch to a test runner environment.
     *
     * @example
     * ```ts
     * const preparedCode = this.prepareTestCodeWithContext(testCode, {
     *   runtime: { suiteId, runnerId, bail: true }
     * });
     * ```
     *
     * @since 1.0.0
     */

    private prepareTestCodeWithContext(testCode: string, context: Record<string, RuntimeConfigInterface>): string {
        const __filename = context.runtime.path;
        const __dirname = dirname(__filename);

        return `__dirname=${ JSON.stringify(__dirname) };` +
            `__filename=${ JSON.stringify(__filename) };` +
            `globalThis.__XJET = ${ JSON.stringify(context) }; ${ testCode }`;
    }
}
