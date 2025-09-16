/**
 * Import will remove at compile time
 */

import type { Struct } from '@remotex-labs/xstruct';

/**
 * Imports
 */

import { errorSchema, eventsSchema, logSchema, statusSchema } from '@packets/schema/packet.schema';

/**
 * Defines the different kinds of packets that can be transmitted or received.
 *
 * @remarks
 * Each packet kind corresponds to a specific type of event or message in the test framework:
 * - `Log`: Console or logging messages
 * - `Error`: Suite-level fatal errors
 * - `Status`: Test or describe start events, including `skipped` and `todo` flags
 * - `Events`: Test or describe end events, only for completed tests/describes (no skipped or TODO)
 *
 * @since 1.0.0
 */

export const enum PacketKind {
    /**
     * Represents a log message packet, e.g., `console.log`, `console.error`.
     * @since 1.0.0
     */

    Log = 1,

    /**
     * Represents a fatal suite-level error.
     * Not associated with any test, describe, or hook.
     * @since 1.0.0
     */

    Error = 2,

    /**
     * Represents a status packet for test or describe start events.
     *
     * @remarks
     * Includes flags for:
     * - `skipped`: Whether the test or describe was skipped
     * - `todo`: Whether the test is marked as TODO
     *
     * @since 1.0.0
     */

    Status = 3,

    /**
     * Represents an event packet for test or describe end events.
     *
     * @remarks
     * Only includes completed tests/describes; skipped or TODO tests are not included.
     * Contains information such as `passed` and `duration`.
     *
     * @since 1.0.0
     */

    Events = 4
}

/**
 * Maps each {@link PacketKind} to its corresponding {@link Struct} schema for serialization/deserialization.
 *
 * @remarks
 * This object allows encoding and decoding packets of different kinds using
 * their respective `xStruct` schemas. Use `PacketSchemas[PacketKind.Log]` to
 * get the schema for log packets, etc.
 *
 * @see PacketKind
 * @see Struct
 *
 * @since 1.0.0
 */

export const PacketSchemas: Record<PacketKind, Struct> = {
    [PacketKind.Log]: logSchema,
    [PacketKind.Error]: errorSchema,
    [PacketKind.Status]: statusSchema,
    [PacketKind.Events]: eventsSchema
} as const;
