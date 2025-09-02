/**
 * Import will remove at compile time
 */

import type { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Represents the position of an invocation within a bundle file.
 *
 * @since 1.0.0
 */

export interface PacketInvocationInterface {
    /**
     * The line number where the invocation occurs (0-based).
     * @since 1.0.0
     */

    line: number;

    /**
     * The column number where the invocation occurs (0-based).
     * @since 1.0.0
     */

    column: number;

    /**
     * Source file
     * @since 1.0.0
     */

    source: string;
}

/**
 * Represents the header information for a packet sent.
 * @since 1.0.0
 */

export interface PacketHeaderInterface {
    /**
     * The type of packet being sent.
     *
     * @see PacketKind
     * @since 1.0.0
     */

    kind: PacketKind;

    /**
     * The unique identifier of the test suite.
     *
     * @since 1.0.0
     */

    suiteId: string;

    /**
     * The unique identifier of the runner sending the packet.
     *
     * @since 1.0.0
     */

    runnerId: string;

    /**
     * The timestamp when the packet was created, in ISO string format.
     *
     * @since 1.0.0
     */

    timestamp: string;
}

/**
 * Represents a log entry generated during test execution, similar to console output.
 *
 * @remarks
 * Used to capture messages like `console.log`, `console.error`, `console.info`, etc.,
 * along with metadata about where in the test hierarchy and source code the log originated.
 *
 * @since 1.0.0
 */

export interface PacketLogInterface {
    /**
     * The severity level of the log entry.
     * Typically maps to console levels such as info, warn, debug, or error.
     *
     * @since 1.0.0
     */

    level: number;

    /**
     * The content of the log message.
     * @since 1.0.0
     */

    message: string;

    /**
     * The ancestry path of the test or describe block that generated this log.
     * @since 1.0.0
     */

    ancestry: string;

    /**
     * The location in the source code where the log was generated.
     *
     * @see PacketInvocationInterface
     * @since 1.0.0
     */

    invocation: PacketInvocationInterface;
}

/**
 * Represents a fatal error in a test suite.
 *
 * @remarks
 * This error occurs at the suite level and is **not** associated with any individual test,
 * describe block, or hook (e.g., before/after hooks). It indicates a failure
 * that prevents the suite from running normally.
 *
 * @since 1.0.0
 */

export interface PacketErrorInterface {
    /**
     * The serialized error describing the fatal issue in the suite.
     * @since 1.0.0
     */

    error: string;
}

/**
 * Represents an event emitted when a test or describe block starts or updates during execution.
 *
 * @remarks
 * Used to track the lifecycle of individual tests or describe blocks, including
 * whether they are skipped, marked TODO, or have errors.
 * This does **not** include suite-level fatal errors.
 *
 * @since 1.0.0
 */

export interface PacketStatusInterface {
    /**
     * Indicates whether the status is for a test or a describe block.
     * @since 1.0.0
     */

    type: number;

    /**
     * Indicates if the test or describe block is marked as TODO.
     * @since 1.0.0
     */

    todo: boolean;

    /**
     * Indicates if the test or describe block was skipped.
     * @since 1.0.0
     */

    skipped:  boolean;

    /**
     * Duration of the test or describe block in milliseconds, if available.
     * @since 1.0.0
     */

    duration: number;

    /**
     * The ancestry path of the test or describe block.
     * @since 1.0.0
     */

    ancestry: string;

    /**
     * Human-readable description of the test or describe block.
     * @since 1.0.0
     */

    description: string;
}

/**
 * Represents an event emitted for a test or describe block during execution.
 *
 * @remarks
 * Used to track the lifecycle of individual tests or describe blocks, such as finish.
 * This interface is **not** for suite-level fatal errors.
 *
 * @since 1.0.0
 */

export interface PacketEventsInterface  {
    /**
     * Indicates the type of event and whether it corresponds to a test or a describe block.
     * @since 1.0.0
     */

    type: number;

    /**
     * Error message associated with the test or describe block, if any.
     * @since 1.0.0
     */

    errors: string;

    /**
     * Duration of the test or describe block in milliseconds.
     * @since 1.0.0
     */

    duration: number;

    /**
     * The ancestry path of the test or describe block.
     * @since 1.0.0
     */

    ancestry: string;

    /**
     * Human-readable description of the test or describe block.
     * @since 1.0.0
     */

    description: string;
}

