/**
 * Import will remove at compile time
 */

import type { DecodedPacketType } from '@packets/packets.module';
import type { FunctionLikeType, FunctionType } from '@remotex-labs/xjet-expect';
import type { TranspileFileType } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';
import type { RunnerInterface, RunningSuitesInterface } from '@targets/interfaces/traget.interface';

/**
 * Imports
 */

import EventEmitter from 'events';
import { xJetError } from '@errors/xjet.error';
import { decodePacket } from '@packets/packets.module';
import { QueueService } from '@services/queue.service';
import { inject } from '@symlinks/services/inject.service';
import { FrameworkService } from '@services/framework.service';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Abstract Target class for all xJet execution targets.
 *
 * @remarks
 * A `AbstractTarget` defines the core lifecycle and event-handling logic
 * used by concrete target implementations (e.g., local, remote, or distributed).
 * It manages suites, event dispatching, and lifecycle completion.
 *
 * @since 1.0.0
 */

export abstract class AbstractTarget {
    /**
     * Queue service responsible for scheduling and executing tasks.
     * @since 1.0.0
     */

    protected readonly queue: QueueService;

    /**
     * Tracks the currently running test suites and their associated promises.
     * @since 1.0.0
     */

    protected readonly runningSuites: Map<string, RunningSuitesInterface> = new Map();

    /**
     * Registry of loaded test suites keyed by suite identifier.
     * @since 1.0.0
     */

    protected readonly suites: Map<string, string> = new Map();

    /**
     * Event emitter used for handling log, error, status, and event packets.
     * @since 1.0.0
     */

    protected readonly eventEmitter = new EventEmitter();

    /**
     * Creates a new runner service instance.
     *
     * @param config - The runtime configuration for the runner.
     *
     * @remarks
     * The {@link FrameworkService} is injected automatically and does not need
     * to be passed manually. The constructor initializes the {@link QueueService}
     * with the parallelism level defined in the configuration.
     *
     * @since 1.0.0
     */

    protected readonly framework: FrameworkService = inject(FrameworkService);

    /**
     * Initializes a new {@link AbstractTarget} instance.
     *
     * @param config - The runtime configuration that controls execution behavior,
     * such as parallelism and bail mode.
     *
     * @remarks
     * The constructor sets up the internal {@link QueueService} based on the
     * configured parallelism level. Other dependencies (e.g., {@link FrameworkService})
     * are injected automatically and not passed here.
     *
     * @since 1.0.0
     */

    constructor(protected config: ConfigurationInterface) {
        this.queue = new QueueService(this.config.parallel);
    }

    /**
     * Returns the number of currently active tasks in the queue.
     * @since 1.0.0
     */

    get numberActiveTask(): number {
        return this.queue.size;
    }

    /**
     * Initializes the target environment with the given specification files.
     * @returns A `Promise` that resolves when the initialization is complete.
     *
     * @remarks
     * Implementations should ensure that the target is fully ready for later
     * operations after this method completes.
     *
     * @see {@link disconnect} for cleaning up the target environment.
     * @since 1.0.0
     */

    initTarget?(): Promise<void>;

    /**
     * Frees resources and cleans up the target.
     *
     * @returns A `Promise` that resolves when all resources have been freed.
     *
     * @remarks
     * This abstract method must be implemented by subclasses of `AbstractTarget`.
     * It should handle all necessary teardown and resource releases associated with the target,
     * ensuring a clean shutdown and preventing resource leaks.
     *
     * @see {@link disconnect} for terminating the target's active connections.
     * @since 1.0.0
     */

    freeTarget?(): Promise<void>;

    /**
     * Resolves a human-readable runner name for a given runner identifier.
     *
     * @param runnerId - Identifier of the runner
     *
     * @since 1.0.0
     */

    abstract getRunnerName(runnerId: string): string;

    /**
     * Retrieves all registered runners for the target.
     *
     * @returns An array of {@link RunnerInterface} instances representing all active runners.
     *
     * @remarks
     * Each runner represents a test execution context. Implementations of this method should
     * return all currently available runners, whether they are local or external.
     *
     * @see RunnerInterface
     * @since 1.0.0
     */

    abstract getRunners(): Array<RunnerInterface>;

    /**
     * Executes the provided test or transpiled suites on this target.
     *
     * @param transpileSuites - The transpiled suite files to execute.
     * @param suites - A record mapping original file names to their content.
     *
     * @returns A `Promise` that resolves once all suites have been executed.
     *
     * @remarks
     * This abstract method must be implemented by subclasses of `AbstractTarget`.
     * It should handle the execution of all provided suites, applying them to the
     * target environment and using the corresponding original files as needed.
     *
     * Implementations may include:
     * - Transpiling or preparing files for execution
     * - Running tests or suites in the target environment
     * - Collecting and reporting results or errors
     *
     * @see {@link initTarget}, {@link disconnect}, {@link freeTarget} for target lifecycle methods.
     *
     * @since 1.0.0
     */

    abstract executeSuites(transpileSuites: TranspileFileType, suites: Record<string, string>): Promise<void>;

    /**
     * Subscribe to log events emitted during test execution.
     *
     * @remarks
     * These logs correspond to runtime messages (`console.log`, `console.info`,
     * `console.warn`, `console.error`, etc.) generated inside tests, describe
     * blocks, or hooks. The listener receives the decoded log packet
     * ({@link DecodedPacketType} with {@link PacketKind.Log})
     * along with the test file path.
     *
     * @param key - Must be `'log'`.
     * @param listener - A handler invoked with the decoded log packet and file path.
     *
     * @see DecodedPacketType
     * @see PacketLogInterface
     *
     * @since 1.0.0
     */

    on(key: 'log', listener: FunctionLikeType<void, [ DecodedPacketType<PacketKind.Log>, string ]>): this;

    /**
     * Subscribe to fatal suite error events.
     *
     * @remarks
     * These errors occur at the suite level and are **not** tied to individual
     * tests, describe blocks, or hooks. The listener receives the decoded error
     * packet ({@link DecodedPacketType} with {@link PacketKind.Error})
     * along with the test file path.
     *
     * @param key - Must be `'error'`.
     * @param listener - A handler invoked with the decoded error packet and file path.
     *
     * @see DecodedPacketType
     * @see PacketErrorInterface
     *
     * @since 1.0.0
     */

    on(key: 'error', listener: FunctionLikeType<void, [ DecodedPacketType<PacketKind.Error>, string ]>): this;

    /**
     * Subscribe to test or describe completion events.
     *
     * @remarks
     * These events are emitted when a test or describe block **finishes execution**.
     * Skipped and TODO tests are excluded. The listener receives the decoded events
     * packet ({@link DecodedPacketType} with {@link PacketKind.Events})
     * along with the test file path.
     *
     * @param key - Must be `'events'`.
     * @param listener - A handler invoked with the decoded events packet and file path.
     *
     * @see DecodedPacketType
     * @see PacketEventsInterface
     *
     * @since 1.0.0
     */

    on(key: 'events', listener: FunctionLikeType<void, [ DecodedPacketType<PacketKind.Events>, string ]>): this;

    /**
     * Subscribe to test or describe status updates.
     *
     * @remarks
     * These events are emitted when a test or describe block **starts**, is
     * **skipped**, or marked as **TODO**. The listener receives the decoded
     * status packet ({@link DecodedPacketType} with {@link PacketKind.Status})
     * along with the originating test file path.
     *
     * @param key - Must be `'status'`.
     * @param listener - A handler invoked with the decoded status packet and file path.
     *
     * @see DecodedPacketType
     * @see PacketStatusInterface
     *
     * @since 1.0.0
     */

    on(key: 'status', listener: FunctionLikeType<void, [ DecodedPacketType<PacketKind.Status>, string ]>): this;

    /**
     * Generic listener registration.
     *
     * @param key - Event name
     * @param listener - The listener function
     *
     * @since 1.0.0
     */

    on(key: string | symbol, listener: FunctionType): this {
        this.eventEmitter.on(key, listener);

        return this;
    }

    /**
     * Marks a test suite as complete and resolves or rejects its associated promise.
     *
     * @remarks
     * This method is called when a suite finishes execution or encounters a fatal error.
     * - If `hasError` is `true` and the configuration has `bail` enabled, all remaining tasks in the queue are stopped
     *   and the suite's promise is rejected.
     * - Otherwise, the suite's promise is resolved normally.
     *
     * After completion, the suite is removed from the `runningSuites` map.
     *
     * @param suiteId - The unique identifier of the test suite.
     * @param hasError - Whether the suite encountered a fatal error. Defaults to `false`.
     *
     * @since 1.0.0
     */

    completeSuite(suiteId: string, hasError = false): void {
        const suiteContext = this.runningSuites.get(suiteId);
        if (!suiteContext) {
            return;
        }

        this.runningSuites.delete(suiteId);
        if (hasError && this.config.bail) {
            this.queue.stop();
            this.queue.clear();
            suiteContext.reject();
        } else {
            suiteContext.resolve();
        }
    }

    /**
     * Processes a raw packet buffer received from a runner and emits the corresponding event.
     *
     * @param buffer - The raw buffer containing the encoded packet.
     *
     * @throws xJetError - If the packet belongs to an unregistered suite or has an invalid kind.
     *
     * @remarks
     * The method decodes the packet using the schema defined in {@link PacketSchemas} and routes it
     * to the appropriate event based on its kind:
     * - `PacketKind.Log` → emits a `'log'` event
     * - `PacketKind.Error` → marks the suite as complete with an error and emits an `'error'` event
     * - `PacketKind.Status` → emits a `'status'` event (for start, skip, or TODO)
     * - `PacketKind.Events` → emits an `'events'` event (for test/describe end that is not skipped or TODO)
     *
     * If the packet's `suiteId` is not registered in the `suites` map, an {@link xJetError} is thrown.
     * Any unknown `kind` also results in an {@link xJetError}.
     *
     * @since 1.0.0
     */

    protected dispatch(buffer: Buffer): void {
        const data = decodePacket(buffer);
        const suitePath = this.suites.get(data.suiteId);
        if (!suitePath) throw new xJetError(
            `Runner '${ data.runnerId }' in test suite '${ data.suiteId }' is not registered`
        );

        switch (data.kind) {
            case PacketKind.Log:
                this.eventEmitter.emit('log', data, suitePath);
                break;

            case PacketKind.Error:
                this.completeSuite(data.runnerId + data.suiteId, true);
                this.eventEmitter.emit('error', data, suitePath);
                break;

            case PacketKind.Status:
                this.eventEmitter.emit('status', data, suitePath);
                break;

            case PacketKind.Events:
                this.eventEmitter.emit('events', data, suitePath);
                break;

            default:
                const errorMessage = `Invalid schema type '${ data.kind }' detected for runner '${ data.runnerId }' in test suite '${ data.suiteId }'`;
                throw new xJetError(errorMessage);
        }
    }

    /**
     * Generates a pseudo-random alphanumeric identifier.
     *
     * @returns A pseudo-random alphanumeric string.
     *
     * @remarks
     * The ID is composed of two concatenated random strings, each derived from
     * `Math.random()` and converted to base-36, then truncated to 7 characters.
     * This method is typically used to create unique identifiers for suites,
     * runners, or tasks at runtime. Note that the IDs are not cryptographically secure.
     *
     * @since 1.0.0
     */

    protected generateId(): string {
        return Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Registers multiple suites in the target's internal map.
     *
     * @param suites - A record mapping suite name to their file paths.
     *
     * @remarks
     * This method clears any previously registered suites and adds the provided ones.
     * Each suite is stored in the internal `suites` map in two ways:
     * 1. They generated unique ID maps to the suite's file path.
     * 2. The original suite name maps to the generated ID.
     *
     * This allows suites to be accessed either by their unique ID or by their original name.
     * The suite content itself is not duplicated in memory; only references and IDs are stored.
     *
     * @example
     * ```ts
     * this.setSuites({
     *   "loginTests": "/path/to/login.spec.ts",
     *   "signupTests": "/path/to/signup.spec.ts"
     * });
     * ```
     *
     * @since 1.0.0
     */

    protected setSuites(suites: Record<string, string>): void {
        this.suites.clear();
        if(!suites) throw new xJetError(
            'Suites must be provided to register them in the target'
        );

        for (const [ suiteName, path ] of Object.entries(suites)) {
            const id = this.generateId();
            this.suites.set(id, path);
            this.suites.set(suiteName, id);
        }
    }
}
