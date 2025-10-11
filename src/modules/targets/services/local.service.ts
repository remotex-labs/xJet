/**
 * Import will remove at compile time
 */

import type { RunnerInterface } from '@targets/interfaces/traget.interface';
import type {
    ModuleInterface,
    TranspileFileInterface,
    TranspileFileType
} from '@services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import * as process from 'process';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import { dirname, relative } from 'path';
import { sandboxExecute } from '@services/vm.service';
import { serializeError } from '@remotex-labs/xjet-expect';
import { Injectable } from '@symlinks/services/inject.service';
import { AbstractTarget } from '@targets/abstract/target.abstract';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Local execution target for running tests within the local JavaScript environment.
 *
 * @remarks
 * The `LocalService` executes tests directly in a sandboxed environment
 * rather than using external runners. It handles:
 * - Test execution
 * - Error handling
 * - Source mapping and runtime context injection for accurate reporting
 *
 * @example
 * ```ts
 * const localService = new LocalService(config, frameworkService);
 * await localService.initTarget();
 * await localService.executeSuites(transpileFiles, originalFiles);
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
     * Unique identifier for the local runner instance.
     *
     * @remarks
     * This ID is generated when the `LocalService` instance is created and is used
     * to track test suites executed in the local environment. It ensures that each
     * suite execution can be associated with a specific runner for reporting and
     * error handling purposes.
     *
     * @since 1.0.0
     */

    private runnerId: string = this.generateId();

    /**
     * Returns the name of the local runner.
     *
     * @remarks
     * Since `LocalService` only has a single runner, this method always returns
     * the string `'local'`. It is used to identify the runner in reports,
     * events, and suite execution tracking.
     *
     * @returns The string `'local'`.
     *
     * @since 1.0.0
     */

    getRunnerName(): string {
        return 'local';
    }

    /**
     * Returns an array containing the local runner.
     *
     * @returns An array with a single object:
     * - `id`: The unique runner ID (`runnerId`).
     * - `name`: The runner name, always `'local'`.
     *
     * @remarks
     * `LocalService` only manages a single local runner. This method provides
     * a consistent interface with other targets by returning an array of
     * `RunnerInterface` objects, each with an `id` and `name`.
     *
     * @example
     * ```ts
     * const runners = localService.getRunners();
     * console.log(runners[0].id);   // e.g., 'local-123'
     * console.log(runners[0].name); // 'local'
     * ```
     *
     * @since 1.0.0
     */

    getRunners(): Array<RunnerInterface> {
        return [
            {
                id: this.runnerId,
                name: this.getRunnerName()
            }
        ];
    }

    startQueue(suites: Record<string, string>): void {
        this.queue.start();
        this.setSuites(suites);
    }

    executeSuites(transpileSuite: TranspileFileInterface): Array<Promise<void>> {
        const relativePath = relative(this.framework.rootPath, transpileSuite.path).replace(/\.[^/.]+$/, '');
        const task = this.executeTestWithErrorHandling(transpileSuite.code, transpileSuite.path, relativePath);

        return [ this.queue.enqueue(task) ];
    }

    /**
     * Executes test code in a local sandboxed environment.
     *
     * @param testCode - The transpiled test code to execute.
     * @param transpileFilePath - The original file path of the test file.
     * @param suiteId - The unique ID of the suite being executed.
     *
     * @remarks
     * This method creates a sandboxed execution context including
     * - Node.js globals (`Buffer`, `console`, timers)
     * - A `module` object for CommonJS exports
     * - A `require` function scoped to the test file
     * - A `__XJET` runtime context containing configuration and suite metadata
     * - A `dispatch` function for emitting test events
     *
     * The `sandboxExecute` function runs the test code within this isolated context.
     *
     * @example
     * ```ts
     * await localService.executeInSandbox(testCode, '/path/to/test.spec.ts', suiteId);
     * ```
     *
     * @since 1.0.0
     */

    private async executeInSandbox(testCode: string, transpileFilePath: string, suiteId: string): Promise<void> {
        const path = this.suites.get(suiteId)!;
        const module: ModuleInterface = { exports: {} };
        const require = createRequire(transpileFilePath);

        const safeProcess = Object.freeze({
            ...process,
            stdout: { write: (): void => {} },
            stderr: { write: (): void => {} }
        });

        const sandboxContext = {
            Buffer,
            module,
            require,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            process: safeProcess,
            dispatch: this.dispatch.bind(this),
            import_meta: pathToFileURL(path),

            __dirname: dirname(path),
            __filename: path,
            __XJET: {
                runtime: {
                    bail: this.config.bail,
                    path: path,
                    filter: this.config.filter,
                    timeout: this.config.timeout,
                    suiteId: suiteId,
                    runnerId: this.runnerId,
                    randomize: this.config.randomize
                }
            }
        };

        await sandboxExecute(testCode, sandboxContext);
    }

    /**
     * Executes a single test suite in the local sandbox with error handling.
     *
     * @param testCode - The transpiled test code to execute.
     * @param filePath - The original file path of the test file.
     * @param relativePath - The relative path used to retrieve the suite ID.
     *
     * @returns A `Promise` that resolves when the suite has been executed or fails gracefully.
     *
     * @remarks
     * This method wraps the execution of a test suite in a `Promise` and tracks
     * it in the `runningSuites` map using the suite ID. If `executeInSandbox`
     * throws an error, the suite is marked as complete with failure, and an
     * 'error' event is emitted via the `eventEmitter`.
     *
     * The emitted error includes:
     * - `kind`: The packet type (`PacketKind.Error`)
     * - `error`: The serialized error object
     * - `suiteId`: The unique ID of the suite
     * - `runnerId`: The ID of the local runner
     *
     *
     * @example
     * ```ts
     * await localService.executeTestWithErrorHandling(testCode, '/path/to/test.spec.ts', 'tests/test.spec');
     * ```
     *
     * @since 1.0.0
     */

    private executeTestWithErrorHandling(testCode: string, filePath: string, relativePath: string): Promise<void> {
        const suiteId = this.suites.get(relativePath)!;

        return new Promise(async (resolve, reject) => {
            try {
                this.runningSuites.set(this.runnerId + suiteId, { resolve, reject });
                await this.executeInSandbox(testCode, filePath, suiteId);
            } catch (error) {
                this.completeSuite(this.runnerId + suiteId, true);
                this.eventEmitter.emit('error', {
                    kind: PacketKind.Error,
                    error: JSON.stringify(serializeError(error)),
                    suiteId: suiteId,
                    runnerId: this.runnerId,
                    timestamp: new Date()
                }, this.suites.get(suiteId)!);
            }
        });
    }
}
