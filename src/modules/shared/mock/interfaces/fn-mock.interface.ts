/**
 * Import will remove at compile time
 */

import type { MockState } from '@shared/states/mock.state';

/**
 * Represents a mockable function interface with a customizable return type, context,
 * and argument list. This interface extends `MockState` to facilitate tracking
 * and testing of function behaviors and states.
 *
 * @template ReturnType - Specifies the return type of the function. Defaults to `unknown`.
 * @template Context - Defines the function's "this" context type. Defaults to `unknown`.
 * @template Args - Sets the argument type(s) for the function, represented as an array. Defaults to `unknown[]`.
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

//eslint-disable-next-line
export interface FnMockInterface<ReturnType = unknown, Args extends Array<unknown> = any, Context = any> extends MockState<ReturnType, Args, Context> {
    new(...args: Args): ReturnType;
    (this: Context, ...args: Args): ReturnType;
}
