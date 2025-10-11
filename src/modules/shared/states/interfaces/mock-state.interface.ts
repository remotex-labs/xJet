/**
 * Import will remove at compile time
 */

import type { FunctionLikeType, FunctionType } from '@remotex-labs/xjet-expect';

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

export interface MocksStateInterface<F extends FunctionType> {
    /**
     * An array that holds the arguments for each invocation made to the mock.
     * Each entry corresponds to the arguments passed during a single call to the mock function.
     *
     * @since 1.0.0
     */

    calls: Array<Parameters<F>>;

    /**
     * The arguments passed to the mock during its most recent invocation.
     * Returns `undefined` if the mock has not been called yet.
     *
     * @since 1.0.0
     */

    lastCall?: Parameters<F>;

    /**
     * An array of contexts (`this` values) for each invocation made to the mock.
     * Each entry corresponds to the context in which the mock was called.
     *
     * @since 1.0.0
     */

    contexts: Array<ThisParameterType<F>>;

    /**
     * An array of all object instances created by the mock.
     * Each entry represents an instance was instantiated during the mocks invocations.
     *
     * @since 1.0.0
     */

    instances: Array<ThisParameterType<F>>;

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

    results: Array<MockInvocationResultInterface<ReturnType<F>>>;
}

/**
 * Extracts the resolved value type from a `PromiseLike` type.
 *
 * @template T The input type to inspect.
 *
 * @remarks
 * If `T` extends `PromiseLike<infer U>`, the resulting type is `U | T`, meaning it includes both
 * the resolved value type and the original `PromiseLike` type.
 *
 * If `T` is not a `PromiseLike`, the resulting type is simply `T`.
 *
 * This utility type is useful when you want to support both synchronous and asynchronous values
 * transparently — for example, when a function may return either a raw value or a promise.
 *
 * @example
 * ```ts
 * type A = PromiseValueType<Promise<number>>; // number | Promise<number>
 * type B = PromiseValueType<string>;          // string
 * ```
 *
 * @since 1.0.0
 */

export type PromiseValueType<T> = T | (T extends PromiseLike<infer U> ? U | T : never);

/**
 * A utility type that extracts the signature of a function and allows it to be reused in an implementation.
 *
 * @remarks
 * This type creates a representation of a function's signature based on its return type, parameters, and
 * `this` context. It's particularly useful for creating mock implementations, decorators, or wrappers
 * that need to maintain the same signature as the original function.
 *
 * By using this type, you can ensure type safety when implementing functions that need to match
 * an existing function's signature exactly, including its return type, parameter types, and `this` binding.
 *
 * @typeParam F - The original function type to extract the signature from
 *
 * @example
 * ```ts
 * // Original function
 * function greet(name: string): string {
 *   return `Hello, ${name}!`;
 * }
 *
 * // Implementation with the same signature
 * const mockGreet: ImplementationType<typeof greet> = function(name) {
 *   return `Mocked greeting for ${name}`;
 * };
 *
 * // Both functions now have the exact same type signature
 * ```
 *
 * @since 1.2.2
 */

export type ImplementationType<F extends FunctionType> =
    FunctionLikeType<ReturnType<F>, Parameters<F>, ThisParameterType<F>>

