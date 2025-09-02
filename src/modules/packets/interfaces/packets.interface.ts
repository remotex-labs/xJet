/**
 * Import will remove at compile time
 */

import type { PacketKind } from '@packets/constants/packet-schema.constants';
import type { PacketStatusInterface } from '@packets/interfaces/packet-schema.interface';
import type { PacketHeaderInterface, PacketLogInterface } from '@packets/interfaces/packet-schema.interface';
import type { PacketErrorInterface, PacketEventsInterface } from '@packets/interfaces/packet-schema.interface';

/**
 * Maps each {@link PacketKind} to its corresponding packet payload interface.
 *
 * @remarks
 * This type is used internally to associate packet kinds with their structured payloads.
 * For example, a `PacketKind.Log` corresponds to a {@link PacketLogInterface} payload.
 *
 * @since 1.0.0
 */

export type PacketPayloadMapType = {
    [PacketKind.Log]: PacketLogInterface;
    [PacketKind.Error]: PacketErrorInterface;
    [PacketKind.Status]: PacketStatusInterface;
    [PacketKind.Events]: PacketEventsInterface;
}

/**
 * Represents a fully decoded packet, combining its payload and the standard packet header.
 *
 * @template T - The {@link PacketKind} indicating the type of payload
 *
 * @remarks
 * This type merges the payload interface corresponding to `T` from {@link PacketPayloadMapType}
 * with {@link PacketHeaderInterface}, so every decoded packet contains both its header and payload.
 *
 * @example
 * ```ts
 * const decodedLog: DecodedPacketType<PacketKind.Log> = {
 *   kind: PacketKind.Log,
 *   suiteId: 'suite1',
 *   runnerId: 'runner1',
 *   timestamp: '2025-09-02T08:00:00Z',
 *   level: 1,
 *   message: 'Test log message',
 *   ancestry: 'root.describe.test',
 *   invocation: { line: 12, column: 5 }
 * };
 * ```
 *
 * @since 1.0.0
 */

export type DecodedPacketType<T extends PacketKind> = PacketPayloadMapType[T] & PacketHeaderInterface
