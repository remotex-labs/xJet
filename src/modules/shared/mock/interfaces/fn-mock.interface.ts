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

