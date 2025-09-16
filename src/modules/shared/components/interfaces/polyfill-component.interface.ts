/**
 * Represents an interface for defining bound context and arguments.
 *
 * @template Context - The type of the bound `this` context, which can be an object, null, or undefined.
 * @template Args - The type of the array representing bound arguments.
 *
 * @remarks
 * This interface is designed to store binding metadata, specifically a reference to the bound `this` context
 * and any arguments that are pre-applied during function binding. It is often used in scenarios involving
 * dynamic contexts or partial application of functions.
 *
 * @see ContextType
 *
 * @since 1.0.0
 */

export interface BoundInterface<Context = unknown | null | undefined, Args = Array<unknown>> {
    __boundThis?: Context;
    __boundArgs?: Args;
}
