/**
 * Import will remove at compile time
 */

import type { MockState } from '@shared/states/mock.state';
import type { FunctionType } from '@remotex-labs/xjet-expect';

/**
 * Represents a mockable function interface with a customizable return type, context,
 * and argument list. This interface extends `MockState` to facilitate tracking
 * and testing of function behaviors and states.
 *
 * @template F - The function / class type being mocked
 *
 * @remarks
 * This interface is useful for creating test doubles or mock implementations that simulate
 * complex behaviors (allows for both `function-like` behavior and `constructor-like` behavior)
 * while tracking interactions and state information.
 *
 * @see MockState
 *
 * @since 1.0.0
 */

export interface MockableFunctionInterface<F extends FunctionType> extends MockState<F> {
    /**
     * Constructor signature when the mocked item is used with 'new'
     */

    new(...args: Parameters<F>): ReturnType<F>;

    /**
     * Function call signature preserving 'this' context and parameters
     */

    (this: ThisParameterType<F>, ...args: Parameters<F>): ReturnType<F>;
}

/**
 * Makes properties of a type or its resolved promise value optional.
 * Converts `never` to `void` to avoid unassignable types.
 *
 * @template T - The type to transform
 *
 * @remarks
 * If `T` is a `PromiseLike` type, this utility unwraps it and makes the resolved value's
 * properties optional.
 * If `T` is `never`, it is converted to `void`.
 * Otherwise, it directly makes `T`'s properties optional.
 *
 * @example
 * ```ts
 * // Makes properties of User optional
 * type MaybeUser = PartialResolvedType<User>;
 *
 * // Makes properties of resolved User optional
 * type MaybeAsyncUser = PartialResolvedType<Promise<User>>;
 *
 * // Never becomes void
 * type MaybeNever = PartialResolvedType<never>; // void
 * ```
 *
 * @since 1.2.2
 */

export type PartialResolvedType<T> =
    [ T ] extends [ never ]
        ? void : T extends PromiseLike<infer U>
            ? Promise<Partial<U>>
            : Partial<T>;
