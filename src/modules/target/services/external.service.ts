/**
 * Import will remove at compile time
 */

import type { TranspileFileType } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface, TestRunnerInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import yargs from 'yargs';
import { relative } from 'path';
import { xJetError } from '@errors/xjet.error';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { serializeError } from '@remotex-labs/xjet-expect';
import { withTimeout } from '@components/timeout.component';
import { Injectable } from '@symlinks/services/inject.service';
import { AbstractTarget } from '@target/abstract/target.abstract';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Implementation of a test execution target that runs tests in external runners.
 *
 * @remarks
 * The `ExternalService` coordinates test execution across external processes or environments.
 * It connects to configured test runners, dispatches test code, and manages their lifecycle
 * (connection, execution, disconnection).
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
 * await externalTarget.executeSuites(transpileFiles);
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
     * Registered test runners, keyed by their unique IDs.
     *
     * @since 1.0.0
     */

    readonly runners: Map<string, TestRunnerInterface> = new Map();

    /**
     * Creates an instance of `ExternalService`.
     *
     * @param config - The configuration object containing test runner setup and execution options.
     *
     * @throws xJetError - If no test runners are configured.
     *
     * @since 1.0.0
     */

    constructor(protected config: ConfigurationInterface) {
        super(config);
        if (!this.config.testRunners) {
            throw new xJetError('Test runners configuration is required for ExternalTarget');
        }
    }

    /**
     * Initializes all configured external runners and establishes connections.
     *
     * @returns A promise that resolves when all runners are connected.
     *
     * @throws xJetError - If no test runners are available in the configuration.
     *
     * @since 1.0.0
     */

    async initTarget(): Promise<void> {
        let argv: Record<string, unknown> = {};
        if (this.config.userArgv) {
            argv = yargs(process.argv.slice(2))
                .options(this.config.userArgv)
                .parseSync();
        }

        if (!this.config.testRunners || this.config.testRunners.length === 0)
            throw new xJetError('No test runners configured');

        await Promise.all(
            this.config.testRunners.map(runner => this.connectRunner(runner, argv))
        );
    }

    /**
     * Retrieves the human-readable name of a runner by its ID.
     *
     * @param runnerId - The unique identifier of the runner.
     * @returns The runner's name.
     *
     * @throws xJetError - If no runner with the given ID is found.
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
     * Executes transpiled test suites across all connected runners.
     *
     * @param transpileFiles - Collection of transpiled test files.
     * @param watchMode - Whether to keep runners connected after execution (default: `false`).
     * @returns A promise that resolves when all test suites finish execution.
     *
     * @remarks
     * Each transpiled file is dispatched to all registered runners.
     * If `watchMode` is disabled, all runners are disconnected after execution.
     *
     * @example
     * ```ts
     * await externalTarget.executeSuites(transpileFiles, false);
     * ```
     *
     * @since 1.0.0
     */

    async executeSuites(transpileFiles: TranspileFileType, watchMode: boolean = false): Promise<void> {
        const testExecutionTasks: Array<Promise<void>> = [];

        for (const transpile of transpileFiles) {
            const relativePath = relative(this.framework.rootPath, transpile.path);

            this.runners.forEach((runner: TestRunnerInterface, id: string) => {
                testExecutionTasks.push(this.queue.enqueue(async () => {
                    return this.executeTestWithErrorHandling(transpile.code, transpile.path, relativePath, runner);
                }, id));
            });
        }

        this.queue.start();
        await Promise.allSettled(testExecutionTasks);
        if (!watchMode) this.disconnectAllRunners();
    }

    /**
     * Connects to a single test runner with a timeout.
     *
     * @param runner - The test runner to connect.
     * @param argv - Parsed user arguments to pass to the runner.
     *
     * @since 1.0.0
     */

    private async connectRunner(runner: TestRunnerInterface, argv: Record<string, unknown>): Promise<void> {
        runner.id = this.generateId();

        try {
            await withTimeout(
                () => runner?.connection?.(this.dispatch.bind(this), runner.id!, argv),
                runner?.connectionTimeout ?? 5000,
                `connection of runner "${ runner.name }"`
            );

            this.runners.set(runner.id, runner);
        } catch (error) {
            console.log(new VMRuntimeError(error instanceof Error ? error : new Error(String(error))));
        }
    }

    /**
     * Disconnects all active test runners.
     *
     * @since 1.0.0
     */

    private disconnectAllRunners(): void {
        this.runners.forEach(async (runner: TestRunnerInterface) => {
            try {
                await runner?.disconnect?.();
            } catch (error) {
                console.error(new VMRuntimeError(error instanceof Error ? error : new Error(String(error))));
            }
        });
    }

    /**
     * Executes a single test suite in a runner with error handling.
     *
     * @param testCode - The transpiled test code.
     * @param filePath - The full path of the test file.
     * @param relativePath - The relative path from project root.
     * @param runner - The test runner responsible for execution.
     * @returns A promise that resolves when execution finishes.
     *
     * @remarks
     * Errors are caught, the suite is marked as failed, and an `'error'` event is emitted.
     *
     * @since 1.0.0
     */

    private executeTestWithErrorHandling(testCode: string, filePath: string, relativePath: string, runner: TestRunnerInterface): Promise<void> {
        const suiteId = this.generateId();
        this.suites.set(suiteId, relativePath);

        return new Promise<void>(async (resolve, reject) => {
            try {
                this.runningSuites.set(suiteId, { resolve, reject });
                await this.executeInRunner(testCode, filePath, suiteId, runner);
            } catch (error) {
                this.completeSuite(suiteId, true);
                this.eventEmitter.emit('error', {
                    kind: PacketKind.Error,
                    error: JSON.stringify(serializeError(error)),
                    suiteId: suiteId,
                    runnerId: runner.id
                });
            }
        });
    }

    /**
     * Dispatches test code to a runner for execution.
     *
     * @param testCode - The transpiled test code.
     * @param testFilePath - The test file path.
     * @param suiteId - The suite identifier.
     * @param runner - The runner to execute the test in.
     *
     * @returns A promise that resolves when the dispatch completes.
     *
     * @since 1.0.0
     */

    private async executeInRunner(testCode: string, testFilePath: string, suiteId: string, runner: TestRunnerInterface): Promise<void> {
        const runtimeContext = {
            bail: this.config.bail,
            path: testFilePath,
            filter: this.config.filter,
            timeout: this.config.timeout,
            suiteId: suiteId,
            runnerId: runner.id,
            randomize: this.config.randomize
        };

        const preparedTestCode = this.prepareTestCodeWithContext(testCode, runtimeContext);
        await withTimeout(
            () => runner?.dispatch?.(Buffer.from(preparedTestCode), suiteId),
            runner?.dispatchTimeout ?? 5000,
            `dispatch of runner "${ runner.name }"`
        );
    }

    /**
     * Embeds runtime context into test code before execution.
     *
     * @param testCode - The raw transpiled test code.
     * @param context - The runtime context object.
     * @returns The test code prefixed with runtime context.
     *
     * @since 1.0.0
     */

    private prepareTestCodeWithContext(testCode: string, context: Record<string, unknown>): string {
        return `const __XJET = ${ JSON.stringify(context) }; ${ testCode }`;
    }
}
