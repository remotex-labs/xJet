/**
 * Import will remove at compile time
 */

import type { AbstractTarget } from '@targets/abstract/target.abstract';
import type { ErrorType } from '@messages/interfaces/abstract.interface';
import type { AbstractReporter } from '@messages/abstract/report.abstract';
import type { PacketKind } from '@packets/constants/packet-schema.constants';
import type { DecodedPacketType } from '@packets/interfaces/packets.interface';
import type { LogMessageInterface, SuiteErrorInterface } from '@messages/interfaces/messages.interface';
import type { EndAssertionMessageInterface, EndMessageInterface } from '@messages/interfaces/messages.interface';
import type { StackMetadataInterface, StackTraceInterface } from '@providers/interfaces/stack-provider.interface';
import type { StartAssertionMessageInterface, StartMessageInterface } from '@messages/interfaces/messages.interface';

/**
 * Imports
 */

import { stackMetadata } from '@providers/stack.provider';
import { inject } from '@symlinks/services/inject.service';
import { FrameworkService } from '@services/framework.service';
import { LogLevel, MessageType } from '@messages/constants/report.constant';

/**
 * Service for translating low-level {@link AbstractTarget} events into structured reporter messages.
 *
 * @remarks
 * The `MessageService` subscribes to a given execution target and transforms its raw
 * events (logs, errors, suite lifecycle, test events) into structured messages.
 * These messages are forwarded to an {@link AbstractReporter} implementation.
 *
 * Responsibilities:
 * - Logging events (`log`) → {@link handleLog}
 * - Suite errors (`error`) → {@link handleSuiteError}
 * - Suite lifecycle (`status`) → {@link handleSuiteStatus}
 * - Assertions & describes (`events`) → {@link handleSuiteEvent}
 *
 * @example
 * ```ts
 * const service = new MessageService(target);
 * await service.init(['suite.spec.ts'], config);
 * ```
 *
 * @see AbstractTarget
 * @see AbstractReporter
 * @since 1.0.0
 */

export class MessageService {
    /**
     * Framework service reference for resolving source maps and code metadata.
     *
     * @remarks
     * Injected via the DI system. Used mainly to map logs and errors to their
     * original code positions for more precise reporting.
     *
     * @since 1.0.0
     */

    private readonly framework = inject(FrameworkService);

    /**
     * Indicates whether any test-level error has occurred.
     * @private
     */

    private error = false;

    /**
     * Indicates whether any suite-level error has occurred.
     * @private
     */

    private suiteError = false;

    /**
     * Creates a new `MessageService` and subscribes to target events.
     *
     * @param target - The execution target emitting logs, errors, and lifecycle events.
     * @param reporter - The active reporter receiving structured messages.
     *
     * @remarks
     * Binds the following listeners:
     * - `'log'` → {@link handleLog}
     * - `'error'` → {@link handleSuiteError}
     * - `'status'` → {@link handleSuiteStatus}
     * - `'events'` → {@link handleSuiteEvent}
     *
     * @since 1.0.0
     */

    constructor(readonly target: AbstractTarget, readonly reporter: AbstractReporter) {
        this.target.on('log', this.handleLog.bind(this));
        this.target.on('error', this.handleSuiteError.bind(this));
        this.target.on('status', this.handleSuiteStatus.bind(this));
        this.target.on('events', this.handleSuiteEvent.bind(this));
    }

    /**
     * Returns `true` if **any suite-level error** has been detected.
     * @returns `true` if a suite error occurred, otherwise `false`.
     *
     * @since 1.0.0
     */

    get hasSuiteError(): boolean {
        return this.suiteError;
    }

    /**
     * Returns `true` if **any test** has been detected.
     * @returns `true` if there is any error, otherwise `false`.
     *
     * @since 1.0.0
     */

    get hasError(): boolean {
        return this.error;
    }

    /**
     * Transforms a log packet into a {@link LogMessageInterface} and sends it to the reporter.
     *
     * @param log - The decoded log packet.
     * @param suitePath - Path of the suite that generated the log.
     *
     * @remarks
     * Resolves source position using source maps, attaches invocation context,
     * and passes the structured message to `reporter.log`.
     *
     * @example
     * ```ts
     * target.emit('log', logPacket, '/suite/path');
     * ```
     *
     * @see LogMessageInterface
     * @since 1.0.0
     */

    handleLog(log: DecodedPacketType<PacketKind.Log>, suitePath: string): void {
        const sourcemap = this.framework.getSourceMap(log.invocation.source);
        const source = sourcemap?.getPositionWithCode(log.invocation.line, log.invocation.column);

        const message: LogMessageInterface = {
            level: LogLevel[log.level] ?? 'UNKNOWN',
            suite: suitePath,
            runner: this.target.getRunnerName(log.runnerId),
            levelId: log.level,
            message: log.message,
            ancestry: log.ancestry.split(','),
            timestamp: new Date(log.timestamp)
        };

        if (source) {
            message.invocation = {
                code: source.code,
                line: source.line,
                column: source.column,
                source: source.source
            };
        }

        this.reporter.log?.(message);
    }

    /**
     * Transforms a suite error into an {@link EndMessageInterface} and sends it to the reporter.
     *
     * @param suiteError - The decoded error packet.
     * @param suitePath - Path of the suite where the error occurred.
     *
     * @remarks
     * Marks the suite as complete, decodes the error via {@link decodeError},
     * and forwards the message to `reporter.suiteEnd`.
     *
     * @see EndMessageInterface
     * @see SuiteErrorInterface
     * @since 1.0.0
     */

    handleSuiteError(suiteError: DecodedPacketType<PacketKind.Error>, suitePath: string): void {
        this.target.completeSuite(suiteError.runnerId + suiteError.suiteId, true);
        const message: EndMessageInterface = {
            suite: suitePath,
            error: <SuiteErrorInterface>this.decodeError(suiteError.error, { linesBefore: 2, linesAfter: 3 }),
            runner: this.target.getRunnerName(suiteError.runnerId),
            duration: 0,
            timestamp: new Date(suiteError.timestamp)
        };

        this.suiteError = true;
        this.reporter.suiteEnd?.(message);
    }

    /**
     * Handles suite lifecycle status updates.
     *
     * @param status - The decoded status packet.
     * @param suitePath - Path of the suite associated with the status.
     *
     * @remarks
     * Supported types:
     * - `StartSuite` → calls `reporter.suiteStart`
     * - `EndSuite` → marks suite complete and calls `reporter.suiteEnd`
     * - `Test` / `Describe` → builds a {@link StartAssertionMessageInterface} and calls `reporter.testStart` / `reporter.describeStart`
     *
     * @see MessageType
     * @see StartAssertionMessageInterface
     * @since 1.0.0
     */

    handleSuiteStatus(status: DecodedPacketType<PacketKind.Status>, suitePath: string): void {
        const baseMessage: StartMessageInterface = {
            suite: suitePath,
            runner: this.target.getRunnerName(status.runnerId),
            timestamp: new Date(status.timestamp)
        };

        switch (status.type) {
            case MessageType.StartSuite:
                this.reporter.suiteStart?.(baseMessage);
                break;
            case MessageType.EndSuite:
                this.target.completeSuite(status.runnerId + status.suiteId, false);
                (<EndMessageInterface> baseMessage).duration = status.duration;
                this.reporter.suiteEnd?.(<EndMessageInterface> baseMessage);
                break;
            case MessageType.Test:
            case MessageType.Describe: {
                const assertionMessage: StartAssertionMessageInterface = <StartAssertionMessageInterface> baseMessage;
                assertionMessage.ancestry = status.ancestry.split(',');
                assertionMessage.description = status.description;

                if (status.todo) assertionMessage.todo = true;
                if (status.skipped) assertionMessage.skipped = true;

                if (status.type === MessageType.Test) {
                    this.reporter.testStart?.(assertionMessage);
                } else {
                    this.reporter.describeStart?.(assertionMessage);
                }
                break;
            }
        }
    }

    /**
     * Handles completion of tests or describes.
     *
     * @param events - The decoded event's packet.
     * @param suitePath - Path of the suite associated with this event.
     *
     * @remarks
     * Builds an {@link EndAssertionMessageInterface}, attaches errors if present,
     * and forwards it to `reporter.testEnd` or `reporter.describeEnd`.
     *
     * Sets `hasError = true` if errors are present.
     *
     * @see EndAssertionMessageInterface
     * @since 1.0.0
     */

    handleSuiteEvent(events: DecodedPacketType<PacketKind.Events>, suitePath: string): void {
        const message: EndAssertionMessageInterface = {
            suite: suitePath,
            passed: true,
            runner: this.target.getRunnerName(events.runnerId),
            duration: events.duration,
            ancestry: events.ancestry.split(','),
            timestamp: new Date(events.timestamp),
            description: events.description
        };

        if (events.errors) {
            message.errors = <Array<SuiteErrorInterface>>this.decodeError(events.errors, { linesBefore: 2, linesAfter: 3 });
            message.passed = false;
            this.error = true;
        }

        if(events.type === MessageType.Test) {
            this.reporter.testEnd?.(message);
        } else {
            this.reporter.describeEnd?.(message);
        }
    }

    /**
     * Parses and structures an error or error array.
     *
     * @param error - JSON stringified error(s).
     * @param options - Optional stack trace metadata.
     * @returns Structured error(s).
     *
     * @remarks
     * - Parses into {@link ErrorType}.
     * - Enhances with {@link stackMetadata}.
     * - Falls back to caught error if parsing fails.
     *
     * @see SuiteErrorInterface
     * @since 1.0.0
     */

    private decodeError(error: string, options: StackTraceInterface = {}): SuiteErrorInterface | Array<SuiteErrorInterface> {
        try {
            const errorObject: ErrorType = JSON.parse(error);
            if (Array.isArray(errorObject)) {
                return errorObject.map(err => {
                    return this.structuredError(
                        err,
                        stackMetadata(err, options)
                    );
                });
            }

            return this.structuredError(
                errorObject,
                stackMetadata(errorObject, options)
            );
        } catch (e) {
            return this.structuredError(
                <ErrorType>e, stackMetadata(<ErrorType>e, options)
            );
        }
    }

    /**
     * Converts an {@link ErrorType} into a {@link SuiteErrorInterface}.
     *
     * @param error - Original error object.
     * @param metadata - Stack metadata for enriching error details.
     * @returns A structured error object.
     *
     * @remarks
     * Builds a standardized shape with name, message, matcher result,
     * and enriched stack/position info.
     *
     * @see ErrorType
     * @see StackMetadataInterface
     * @since 1.0.0
     */

    private structuredError(error: ErrorType, metadata: StackMetadataInterface): SuiteErrorInterface {
        return {
            name: error.name,
            line: metadata.line,
            code: metadata.code,
            formatCode: metadata.formatCode,
            stack: metadata.stacks,
            column: metadata.column,
            message: error.message,
            matcherResult: error.matcherResult
        };
    }
}
