/**
 * Import will remove at compile time
 */

import type { ModuleInterface, TranspileFileType } from '@services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import { relative } from 'path';
import { createRequire } from 'module';
import { sandboxExecute } from '@services/vm.service';
import { serializeError } from '@remotex-labs/xjet-expect';
import { Injectable } from '@symlinks/services/inject.service';
import { AbstractTarget } from '@target/abstract/target.abstract';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Local execution target for running tests within the local JavaScript environment.
 *
 * @remarks
 * Unlike external targets, `LocalService` runs tests directly in a sandboxed context.
 * It handles test execution, error handling, and source mapping for accurate reporting.
 *
 * @example
 * ```ts
 * const localService = new LocalService(config, frameworkService);
 * await localService.initTarget();
 * await localService.executeSuites(transpileFiles);
 * ```
 *
 * @see PacketKind
 * @see AbstractTarget
 * @see TranspileFileType
 *
 * @since 1.0.0
 */

@Injectable({
    scope: 'singleton'
})
export class LocalService extends AbstractTarget {
    /**
     * Unique identifier for the runner instance.
     *
     * @default Generated using {@link AbstractTarget.generateId}
     * @since 1.0.0
     */

    private runnerId: string = this.generateId();

    /**
     * Initializes the target runtime environment.
     *
     * @returns A promise that resolves when initialization is complete.
     *
     * @since 1.0.0
     */

    async initTarget(): Promise<void> {
    }

    /**
     * Returns the human-readable name of the runner.
     *
     * @returns The runner name
     *
     * @since 1.0.0
     */

    getRunnerName(): string {
        return 'local';
    }

    /**
     * Executes provided test suites in the local environment.
     *
     * @param transpileFiles - Map of file paths to their transpiled code and source maps.
     * @returns A promise that resolves when all test suites have completed execution.
     *
     * @remarks
     * All test files are queued for execution using the internal task queue,
     * respecting the configured parallelism.
     *
     * @example
     * ```ts
     * await localService.executeSuites(transpileFiles);
     * ```
     *
     * @since 1.0.0
     */

    async executeSuites(transpileFiles: TranspileFileType): Promise<void> {
        const testExecutionTasks: Array<Promise<void>> = [];

        // Prepare all test execution tasks
        for (const transpile of transpileFiles) {
            const relativePath = relative(this.framework.rootPath, transpile.path);

            testExecutionTasks.push(this.queue.enqueue(async () => {
                return this.executeTestWithErrorHandling(transpile.code, transpile.path, relativePath);
            }));
        }

        this.queue.start();
        await Promise.allSettled(testExecutionTasks);
    }

    /**
     * Executes a test file with error handling and source mapping.
     *
     * @param testCode - Transpiled JavaScript code to execute.
     * @param filePath - Absolute path to the test file.
     * @param relativePath - Relative path used for reporting and mapping.
     * @returns A promise that resolves when the test execution completes.
     *
     * @remarks
     * Errors are caught and emitted as `'error'` events. This prevents a single failing test
     * from stopping the overall test execution.
     *
     * @since 1.0.0
     */

    private executeTestWithErrorHandling(testCode: string, filePath: string, relativePath: string): Promise<void> {
        const suiteId = this.generateId();
        this.suites.set(suiteId, relativePath);

        return new Promise(async (resolve, reject) => {
            try {
                this.runningSuites.set(suiteId, { resolve, reject });
                await this.executeInSandbox(testCode, filePath, suiteId);
            } catch (error) {
                this.completeSuite(suiteId, true);
                this.eventEmitter.emit('error', {
                    kind: PacketKind.Error,
                    error: JSON.stringify(serializeError(error)),
                    suiteId: suiteId,
                    runnerId: this.runnerId
                });
            }
        });
    }

    /**
     * Executes code in a sandboxed environment.
     *
     * @param testCode - Transpiled test code.
     * @param testFilePath - Path to the test file.
     * @param suiteId - Unique identifier for the test suite.
     * @returns A promise that resolves when execution completes.
     *
     * @remarks
     * Provides a controlled execution environment with specific globals and runtime
     * configurations. Prevents interference between tests.
     *
     * @internal
     * @since 1.0.0
     */

    private async executeInSandbox(testCode: string, testFilePath: string, suiteId: string): Promise<void> {
        const module: ModuleInterface = { exports: {} };
        const require = createRequire(testFilePath);

        const sandboxContext = {
            Buffer,
            module,
            require,
            console,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            __XJET: {
                bail: this.config.bail,
                path: testFilePath,
                filter: this.config.filter,
                timeout: this.config.timeout,
                suiteId: suiteId,
                runnerId: this.runnerId,
                randomize: this.config.randomize
            },
            dispatch: this.dispatch.bind(this)
        };

        await sandboxExecute(testCode, sandboxContext);
    }
}
