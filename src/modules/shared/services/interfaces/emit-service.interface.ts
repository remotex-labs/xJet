/**
 * Import will remove at compile time
 */
import type { PacketEventsInterface, PacketStatusInterface } from '@packets/interfaces/packet-schema.interface';

/**
 * Represents the payload for emitting an event (e.g., test or describe completion).
 *
 * @remarks
 * Extends {@link PacketEventsInterface} but replaces:
 * - `errors` with a raw {@link Error} array (to be serialized before dispatch).
 * - `ancestry` with a string array for hierarchical test path tracking.
 * - `type` is omitted since it is explicitly provided when emitting.
 *
 * @example
 * ```ts
 * const event: EmitEventInterface = {
 *   ancestry: ['MySuite', 'MyTest'],
 *   description: 'should add numbers correctly',
 *   duration: 42,
 *   errors: [new Error('Expected 2 but got 3')]
 * };
 * emitEvent(MessageType.Test, event);
 * ```
 *
 * @see emitAction
 * @see PacketEventsInterface
 *
 * @since 1.0.0
 */

export interface EmitEventInterface extends Omit<Partial<PacketEventsInterface>, 'errors' | 'ancestry' | 'type'>{
    errors?: Array<Error>;
    ancestry: Array<string>
}

/**
 * Represents the payload for emitting a status update (e.g., suite start or end).
 *
 * @remarks
 * Extends {@link PacketStatusInterface} but replaces:
 * - `ancestry` with a string array for hierarchical test path tracking.
 * - `type` is omitted since it is explicitly provided when emitting.
 *
 * @example
 * ```ts
 * const status: EmitStatusInterface = {
 *   ancestry: ['MySuite'],
 *   description: 'Suite execution started'
 * };
 * emitStatus(MessageType.StartSuite, status);
 * ```
 *
 * @see emitStatus
 * @see PacketStatusInterface
 *
 * @since 1.0.0
 */

export interface EmitStatusInterface extends Omit<Partial<PacketStatusInterface>, 'ancestry' | 'type'>{
    ancestry?: Array<string>
}
