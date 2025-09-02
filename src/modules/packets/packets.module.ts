/**
 * Import will remove at compile time
 */

import type { PacketHeaderInterface } from '@packets/interfaces/packet-schema.interface';
import type { DecodedPacketType, PacketPayloadMapType } from '@packets/interfaces/packets.interface';

/**
 * Imports
 */

import { serializeError } from '@remotex-labs/xjet-expect';
import { PacketKind } from '@packets/constants/packet-schema.constants';
import { errorSchema, headerSchema } from '@packets/schema/packet.schema';
import { PacketSchemas } from '@packets/constants/packet-schema.constants';

/**
 * Exports constants
 */

export * from '@packets/constants/packet-schema.constants';

/**
 * Exports interfaces
 */

export * from '@packets/interfaces/packets.interface';
export * from '@packets/interfaces/packet-schema.interface';

/**
 * Encodes a packet of a given kind into a `Buffer`.
 *
 * @template T - The packet kind (`PacketKind.Log`, `PacketKind.Error`, `PacketKind.Status`, or `PacketKind.Events`)
 *
 * @param kind - The type of packet to encode
 * @param data - Partial data matching the packet type; will be combined with header information
 *
 * @returns A `Buffer` containing the serialized packet
 *
 * @throws Error if the provided `kind` does not correspond to a known packet schema
 *
 * @remarks
 * This function combines a header and the payload according to the packet kind.
 * The header includes the suite ID, runner ID, and a timestamp.
 *
 * @since 1.0.0
 */

export function encodePacket<T extends PacketKind>(kind: T, data: Partial<PacketPayloadMapType[T]>): Buffer {
    const schema = PacketSchemas[kind];
    if (!schema) throw new Error(`Invalid schema kind: ${ kind }`);

    const header: PacketHeaderInterface = {
        kind: kind,
        suiteId: globalThis?.__XJET?.runtime?.suiteId ?? '',
        runnerId: globalThis?.__XJET?.runtime.runnerId ?? '',
        timestamp: (new Date()).toISOString()
    };

    return Buffer.concat([
        headerSchema.toBuffer(header),
        schema.toBuffer(data)
    ]);
}

/**
 * Decodes a packet from a `Buffer` into its corresponding object representation.
 *
 * @template T - The expected packet kind (`PacketKind.Log`, `PacketKind.Error`, `PacketKind.Status`, or `PacketKind.Events`)
 *
 * @param buffer - The buffer containing the encoded packet
 * @returns The decoded packet object, combining the header and payload fields
 *
 * @throws Error if the packet kind is unknown or invalid
 *
 * @remarks
 * Decodes both the header and payload based on the packet kind.
 *
 * @since 1.0.0
 */

export function decodePacket<T extends PacketKind>(buffer: Buffer): DecodedPacketType<T> {
    let offset = headerSchema.size;
    const header = headerSchema.toObject(buffer, (dynamicOffset: number): void => {
        offset += dynamicOffset;
    });

    const type = header.kind as PacketKind;
    const schema = PacketSchemas[type];
    if (!schema) {
        throw new Error(`Unknown packet kind: ${ type }`);
    }

    const dataBuffer = buffer.subarray(offset);
    const data = schema.toObject(dataBuffer) as PacketPayloadMapType[T];

    return { ...header, ...data };
}

/**
 * Encodes an {@link Error} instance into a binary buffer following the packet schema.
 *
 * @param error - The error object to be serialized and encoded.
 * @param suiteId - Identifier of the suite where the error occurred.
 * @param runnerId - Identifier of the runner reporting the error.
 *
 * @returns A {@link Buffer} containing the encoded error packet, ready for transmission.
 *
 * @remarks
 * The function creates two binary sections:
 * - A **header**, describing the packet kind (`Error`), suite ID, runner ID, and timestamp.
 * - A **data buffer**, holding the serialized error details in JSON format.
 *
 * These two sections are concatenated into a single buffer.
 *
 * @example
 * ```ts
 * try {
 *   throw new Error("Test failed");
 * } catch (err) {
 *   const buffer = encodeErrorSchema(err, "suite-123", "runner-456");
 *   socket.send(buffer); // transmit over a transport channel
 * }
 * ```
 *
 * @see serializeError
 * @see PacketKind.Error
 *
 * @since 1.0.0
 */

export function encodeErrorSchema(error: Error, suiteId: string, runnerId: string): Buffer {
    const header = headerSchema.toBuffer({
        kind: PacketKind.Error,
        suiteId: suiteId ?? '',
        runnerId: runnerId ?? '',
        timestamp: (new Date()).toISOString()
    });

    const dataBuffer = errorSchema.toBuffer({
        error: JSON.stringify(serializeError(error))
    });

    return Buffer.concat([ header, dataBuffer ]);
}
