/**
 * Represents the possible result types of a mock function invocation.
 *
 * @template 'return' | 'throw' | 'incomplete'
 *
 * @since 1.0.0
 */

export type MockInvocationResultType = 'return' | 'throw' | 'incomplete';

/**
 * Represents the result of a mock function invocation, providing details regarding the outcome,
 * such as whether the function returned a value, threw an error, or did not complete its execution.
 *
 * @template T - Specifies the expected return type of the mock function when the result is of type `'return'`.
 *
 * @remarks
 * This interface is useful in mock testing frameworks to analyze the behavior of mocked functions
 * and their respective invocation outcomes.
 *
 * @since 1.0.0
 */

export interface MockInvocationResultInterface<T> {
    /**
     * Indicates the result type:
     * - `'return'`: The mock function successfully returned a value.
     * - `'throw'`: The mock function threw an error or exception.
     * - `'incomplete'`: The mock function invocation has not been completed (rare case).
     *
     * @see MockInvocationResultType
     *
     * @since 1.0.0
     */

    type: MockInvocationResultType;

    /**
     * The value associated with the invocation result:
     * - If `type` is `'return'`, this is the mocks return value (`T`).
     * - If `type` is `'throw'`, this is the thrown error (`unknown`).
     * - If `type` is `'incomplete'`, this is `undefined`.
     *
     * @since 1.0.0
     */

    value: T | (unknown & { type?: never }) | undefined | unknown;
}

/**
 * Interface representing the internal state of a mock function, tracking details of its invocations,
 * such as arguments, contexts, return values, and more.
 *
 * @template ReturnType - The type of value returned by the mock function.
 * @template Context - The type of the `this` context used during the mocks execution. Defaults to `DefaultContextType`.
 * @template Args - The type of arguments passed to the mock function. Default to an array of unknown values (`Array<unknown>`).
 *
 * @remarks
 * This interface is designed to provide detailed tracking of mocks behavior,
 * including call arguments, contexts, instances, invocation order, and results.
 * Useful for testing and debugging in scenarios that require precise information about mock execution.
 *
 * @since 1.0.0
 */

export interface MocksStateInterface<ReturnType, Args extends Array<unknown> = [], Context = unknown> {
    /**
     * An array that holds the arguments for each invocation made to the mock.
     * Each entry corresponds to the arguments passed during a single call to the mock function.
     *
     * @since 1.0.0
     */

    calls: Array<Args>;

    /**
     * The arguments passed to the mock during its most recent invocation.
     * Returns `undefined` if the mock has not been called yet.
     *
     * @since 1.0.0
     */

    lastCall?: Args;

    /**
     * An array of contexts (`this` values) for each invocation made to the mock.
     * Each entry corresponds to the context in which the mock was called.
     *
     * @since 1.0.0
     */

    contexts: Array<Context>;

    /**
     * An array of all object instances created by the mock.
     * Each entry represents an instance was instantiated during the mocks invocations.
     *
     * @since 1.0.0
     */

    instances: Array<Context>;

    /**
     * An array of invocation order indices for the mock.
     * xJet assigns an index to each call, starting from 1, to track the order in which mocks are invoked within a test file.
     *
     * @since 1.0.0
     */

    invocationCallOrder: Array<number>;

    /**
     * An array of results for each invocation made to the mock.
     * Each entry represents the outcome of a single call, including the return value or any error thrown.
     *
     * @since 1.0.0
     */

    results: Array<MockInvocationResultInterface<ReturnType>>;
}
