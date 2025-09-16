/**
 * Import will remove at compile time
 */

import type { MessageType } from '@messages/constants/report.constant';
import type { EmitEventInterface, EmitStatusInterface } from '@shared/services/interfaces/emit-service.interface';

/**
 * Imports
 */

import { serializeError } from '@remotex-labs/xjet-expect';
import { encodePacket, PacketKind } from '@packets/packets.module';

/**
 * Emits a status update packet to the dispatcher.
 *
 * @param type - The {@link MessageType} representing the kind of status (e.g., suite start, suite end).
 * @param notification - The {@link EmitStatusInterface} containing ancestry and description details.
 *
 * @remarks
 * This function encodes the notification into a `PacketKind.Status` packet
 * and sends it via the global `dispatch` mechanism.
 *
 * @see MessageType
 * @see encodePacket
 * @see PacketKind.Status
 * @see EmitStatusInterface
 *
 * @since 1.0.0
 */

export function emitStatus(type: MessageType, notification: EmitStatusInterface = {}): void {
    dispatch(encodePacket(PacketKind.Status, {
        type: type,
        todo: notification?.todo,
        skipped: notification?.skipped,
        duration: notification?.duration,
        ancestry: notification?.ancestry?.join(','),
        description: notification?.description
    }));
}

/**
 * Emits an action (event) packet to the dispatcher.
 *
 * @param type - The {@link MessageType} representing the kind of action (e.g., test end, describe end).
 * @param notification - The {@link EmitEventInterface} containing ancestry, description,
 *                       duration, and possible test errors.
 *
 * @remarks
 * - Errors are serialized with {@link serializeError} before being encoded.
 * - The function encodes the notification into a `PacketKind.Events` packet
 *   and sends it via the global `dispatch` mechanism.
 *
 * @see MessageType
 * @see encodePacket
 * @see serializeError
 * @see PacketKind.Events
 * @see EmitEventInterface
 *
 * @since 1.0.0
 */

export function emitEvent(type: MessageType, notification: EmitEventInterface): void {
    const stringErrors = notification.errors?.map((error: Error) =>
        serializeError(error)
    ) || [];

    dispatch(encodePacket(PacketKind.Events, {
        type: type,
        errors: stringErrors.length > 0 ? JSON.stringify(stringErrors) : '',
        ancestry: notification.ancestry.join(''),
        duration: notification.duration,
        description: notification.description
    }));
}
