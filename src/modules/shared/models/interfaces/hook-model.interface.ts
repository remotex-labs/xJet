/**
 * Represents a callback function type used to signal the completion of an operation.
 * Typically used in asynchronous functions to convey success or error states.
 *
 * @param error - An optional parameter indicating the error details.
 * Pass a string or an object with a `message` property to specify the error reason.
 * If no error occurs, this parameter may be omitted or set to `undefined`.
 *
 * @remarks
 * This type is designed for scenarios requiring explicit error signaling.
 * Consumers of this callback should handle both error and non-error cases appropriately.
 *
 * @since 1.0.0
 */

export type DoneCallbackType = (error?: string | { message: string }) => void;

/**
 * Represents a type definition for a callback handler function.
 *
 * @remarks
 * This type can either be:
 * - A synchronous function taking a `done` callback of type `DoneCallbackType`
 * as an argument and optionally returning `undefined`.
 * - An asynchronous function that returns a `Promise<void>`.
 * This type is designed to provide flexibility for synchronous functions operating with a `done` callback
 * or asynchronous functions using `Promise<void>`.
 *
 * @since 1.0.0
 */

export type CallbackHandlerType = ((done: DoneCallbackType) => void | undefined) | (() => Promise<void>);
