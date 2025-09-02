/**
 * Import will remove at compile time
 */

import type { PacketLogInterface, PacketStatusInterface } from '@packets/interfaces/packet-schema.interface';
import type { PacketErrorInterface, PacketEventsInterface } from '@packets/interfaces/packet-schema.interface';
import type { PacketHeaderInterface, PacketInvocationInterface } from '@packets/interfaces/packet-schema.interface';

/**
 * Imports
 */

import { Struct } from '@remotex-labs/xstruct';

/**
 * Schema for serializing and deserializing {@link PacketInvocationInterface} data.
 *
 * @remarks
 * Represents the location in source code where a test, describe, or log originates.
 *
 * @since 1.0.0
 */

export const invocationSchema = new Struct<PacketInvocationInterface>({
    line: 'UInt32LE',
    column: 'UInt32LE',
    source: 'string'
});

/**
 * Schema for serializing and deserializing {@link PacketHeaderInterface} data.
 *
 * @remarks
 * Contains metadata for each packet, including kind, suite and runner identifiers, and timestamp.
 *
 * @since 1.0.0
 */

export const headerSchema = new Struct<PacketHeaderInterface>({
    kind: 'UInt8:4',
    suiteId: { type: 'string', size: 14 },
    runnerId: { type: 'string', size: 14 },
    timestamp: 'string'
});

/**
 * Schema for serializing and deserializing {@link PacketLogInterface} data.
 *
 * @remarks
 * Used for console-like logs emitted by tests or describes, including message, level, ancestry, and invocation.
 *
 * @since 1.0.0
 */

export const logSchema = new Struct<PacketLogInterface>({
    level: 'UInt8',
    message: { type: 'string', lengthType: 'UInt32LE' },
    ancestry: { type: 'string', lengthType: 'UInt32LE' },
    invocation: invocationSchema
});

/**
 * Schema for serializing and deserializing {@link PacketErrorInterface} data.
 *
 * @remarks
 * Represents suite-level fatal errors that are not tied to specific tests or describes.
 *
 * @since 1.0.0
 */

export const errorSchema = new Struct<PacketErrorInterface>({
    error: { type: 'string', lengthType: 'UInt32LE' }
});

/**
 * Schema for serializing and deserializing {@link PacketStatusInterface} data.
 *
 * @remarks
 * Represents status updates for individual tests or describe blocks,
 * including whether it is TODO, skipped, and its ancestry and description.
 *
 * @since 1.0.0
 */

export const statusSchema = new Struct<PacketStatusInterface>({
    type: 'UInt8:5',
    todo: 'UInt8:1',
    skipped: 'UInt8:1',
    duration: 'UInt32LE',
    ancestry: { type: 'string', lengthType: 'UInt32LE' },
    description: { type: 'string', lengthType: 'UInt32LE' }
});

/**
 * Schema for serializing and deserializing {@link PacketEventsInterface} data.
 *
 * @remarks
 * Represents events emitted during the test or describe execution,
 * including pass/fail status, duration, error messages, ancestry, and invocation.
 *
 * @since 1.0.0
 */

export const eventsSchema = new Struct<PacketEventsInterface>({
    type: 'UInt8:5',
    passed: 'UInt8:1',
    duration: 'UInt32LE',
    ancestry: { type: 'string', lengthType: 'UInt32LE' },
    description: { type: 'string', lengthType: 'UInt32LE' },
    errors: { type: 'string', lengthType: 'UInt32LE' }
});
