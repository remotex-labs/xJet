/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';
import type { PromiseValueType } from '@shared/states/interfaces/mock-state.interface';
import type { BoundInterface } from '@shared/components/interfaces/polyfill-component.interface';
import type { MockInvocationResultInterface } from '@shared/states/interfaces/mock-state.interface';
import type { ImplementationType, MocksStateInterface } from '@shared/states/interfaces/mock-state.interface';

/**
 * @template DEFAULT_MOCK_NAME
 * A constant that holds the default name used for mocking purposes.
 * It is commonly used in testing scenarios to provide a standard mock identifier.
 *
 * @remarks
 * The value of `DEFAULT_MOCK_NAME` is set to 'xJet.mock()'. It is recommended
 * to use this variable as the default name to maintain consistency across
 * mock-related functionalities in your application.
 *
 * @since 1.0.0
 */

const DEFAULT_MOCK_NAME = 'xJet.mock()';

/**
 * A powerful mock state manager for simulating functions and classes in tests.
 *
 * @template F - The function signature being mocked, defaults to any function
 *
 * @remarks
 * MockState provides a complete mocking solution. It tracks
 * all invocations, including arguments, return values, and contexts, while also allowing
 * customization of behavior through various methods like `mockImplementation` and
 * `mockReturnValue`.
 *
 * Key features:
 * - Tracks call arguments, return values, and execution contexts
 * - Supports one-time implementations and return values
 * - Manages Promise resolutions and rejections
 * - Provides methods for resetting or restoring mock state
 * - Preserves the interface of the original function
 *
 * @example
 * ```ts
 * // Create a basic mock
 * const mockFn = new MockState();
 *
 * // Configure return values
 * mockFn.mockReturnValue('default');
 * mockFn.mockReturnValueOnce('first call');
 *
 * // Use the mock
 * console.log(mockFn()); // 'first call'
 * console.log(mockFn()); // 'default'
 *
 * // Inspect calls
 * console.log(mockFn.mock.calls); // [[], []]
 * ```
 *
 * @since 1.0.0
 */

export class MockState<F extends FunctionType = FunctionType> extends Function {
    /**
     * List of all mocks that created as WeakRef
     */

    static mocks: Set<WeakRef<MockState>> = new Set();

    /**
     * The `name` property represents the name of the mock function.
     */

    override name: string;

    /**
     * Flag to detect mock functions
     */

    readonly xJetMock: boolean = true;

    /**
     * Holds the current state of the mock, including all invocation records.
     *
     * @remarks
     * This property tracks the complete history of the mock's usage, storing
     * information like call arguments, return values, execution contexts,
     * instances, and the order of invocations.
     *
     * It's initialized with empty arrays for tracking and gets updated with
     * each invocation. This state is what powers the inspection capabilities
     * accessible via the public `mock` getter.
     *
     * @since 1.0.0
     */

    private state: MocksStateInterface<F>;

    /**
     * Stores one-time implementations to be used on successive invocations.
     *
     * @remarks
     * This queue contains functions that will be consumed in FIFO order
     * (first-in, first-out) when the mock is called. Each implementation
     * is used exactly once and then removed from the queue.
     *
     * When adding implementations with `mockImplementationOnce()` or similar
     * methods, they are pushed to this queue. On invocation, the mock will
     * check this queue first, using and removing the oldest implementation
     * if available, or falling back to the default implementation.
     *
     * @since 1.0.0
     */

    private queuedImplementations: Array<ImplementationType<F>> = [];

    /**
     * The current default implementation for this mock.
     *
     * @remarks
     * This property holds the function that will be executed when the mock is called,
     * unless overridden by a queued one-time implementation. It can be set using
     * the `mockImplementation()` method and retrieved with `getMockImplementation()`.
     *
     * If not explicitly set, it defaults to `undefined`, meaning the mock will
     * return `undefined` when called (after any queued implementations are used).
     *
     * This implementation determines the behavior of the mock for all calls that
     * don't have a specific one-time implementation in the queue.
     *
     * @since 1.0.0
     */

    private implementation: ImplementationType<F> | undefined;

    /**
     * Preserves the original implementation provided when creating the mock.
     *
     * @remarks
     * This property stores the initial function passed to the constructor, allowing
     * the mock to be restored to its original behavior later using `mockRestore()`.
     *
     * If no implementation was provided in the constructor, this will contain a
     * function that returns `undefined` when called.
     *
     * The original implementation is immutable and serves as a reference point
     * for resetting the mock to its initial state.
     *
     * @since 1.0.0
     */

    private readonly originalImplementation: ImplementationType<F>;

    /**
     * Optional cleanup function to be called when the mock is restored.
     *
     * @remarks
     * If provided, this function will be executed when `mockRestore()` is called,
     * allowing for custom cleanup operations. This is particularly useful when
     * creating mocks that replace methods or properties on existing objects.
     *
     * The restore function should handle any necessary teardown, such as
     * restoring original object properties, removing event listeners, or
     * closing connections that were established during mock creation.
     *
     * @since 1.0.0
     */

    private readonly restore?: () => F | void;

    /**
     * Creates a new instance of a mock function.
     *
     * @template F - The function type being mocked. This generic type parameter allows
     *               the mock to properly type-check parameters and return values to match
     *               the function signature being mocked.
     *
     * @param implementation - The initial function implementation to use. If not provided,
     *                         the mock will return `undefined` when called.
     * @param restore - Optional cleanup function that will be called when `mockRestore()` is invoked.
     *                  Useful for restoring original behavior when mocking existing object methods.
     * @param name - Optional name for the mock function, used in error messages and test output.
     *               Defaults to "xJet.fn()" if not provided.
     *
     * @remarks
     * The constructor initializes the mock's state, implementation, and metadata.
     * It returns a Proxy that allows the mock to be both a function and an object with properties.
     *
     * The Proxy intercepts:
     * - Function calls (via `apply`)
     * - Property access (via `get`)
     * - Constructor calls with `new` (via `construct`)
     *
     * This enables the mock to track calls, return configured values, and provide
     * helper methods for assertions and configuration.
     *
     * @see ReturnType
     * @see ImplementationType
     *
     * @since 1.0.0
     */

    constructor(implementation?: F, restore?: () => F | void, name?: string) {
        super();
        this.name = name ?? DEFAULT_MOCK_NAME;
        this.state = this.initState();
        this.implementation = implementation || undefined;

        this.restore = restore;
        this.originalImplementation = implementation || ((): ReturnType<F> => <ReturnType<F>> undefined);

        return <this> new Proxy(this, {
            get: this.invokeGet,
            apply: this.invokeFunction,
            construct: <ProxyHandler<object>['construct']> this.invokeClass
        });
    }

    /**
     * Gets a readonly snapshot of the current mocks state.
     *
     * @template F - The function type being mocked.
     *
     * @returns A frozen (immutable) copy of the mock state {@link MocksStateInterface}, containing information
     *          about calls, return values, and other tracking data.
     *
     * @remarks
     * This property provides safe access to the mock's internal state for assertions and
     * debugging purposes. The returned object is a deep copy with all properties frozen
     * to prevent accidental modification of the mock's internal state.
     *
     * @see MocksStateInterface
     *
     * @since 1.0.0
     */

    get mock(): Readonly<MocksStateInterface<F>> {
        return Object.freeze({ ...this.state });
    }

    /**
     * Gets the original function implementation.
     *
     * @template F - The function type being mocked.
     *
     * @returns The original function implementation that was provided when creating the mock
     *          or a default implementation that returns undefined if none was provided.
     *
     * @remarks
     * This property allows access to the original implementation that was stored
     * when the mock was created. It's useful when you need to temporarily access
     * or call the original behavior within test cases.
     *
     * @example
     * ```ts
     * // Create a mock with an original implementation
     * const originalFn = (x: number) => x * 2;
     * const mockFn = xJet.fn(originalFn);
     *
     * // Override the implementation for some tests
     * mockFn.mockImplementation((x: number) => x * 3);
     *
     * // Call the original implementation directly when needed
     * const result = mockFn.original(5); // Returns 10, not 15
     * ```
     *
     * @since 1.0.0
     */

    get original(): F {
        return <F> this.originalImplementation;
    }

    /**
     * Clears all information stored in the mock's state {@link MocksStateInterface}.
     *
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method resets all stored information such as tracked calls, return values,
     * and other state information. It doesn't reset any custom implementations that
     * were set using mockImplementation or similar methods.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn();
     * mockFn('first call');
     * mockFn('second call');
     *
     * expect(mockFn.mock.calls.length).toBe(2);
     *
     * mockFn.mockClear();
     *
     * // All calls information has been cleared
     * expect(mockFn.mock.calls.length).toBe(0);
     * ```
     *
     * @since 1.0.0
     */

    mockClear(): this {
        this.state = this.initState();

        return this;
    }

    /**
     * Resets the mock by clearing all state and removing all queued implementations.
     *
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method performs a more complete reset than mockClear() {@link mockClear}.
     * It clears all stored information about calls and additionally removes any queued implementations that were
     * set using mockImplementationOnce(). The default implementation will be restored.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn(() => 'default');
     * mockFn.mockImplementationOnce(() => 'first call');
     * mockFn.mockImplementationOnce(() => 'second call');
     *
     * console.log(mockFn()); // 'first call'
     *
     * mockFn.mockReset();
     *
     * // All calls have been cleared, and queued implementations removed
     * console.log(mockFn()); // 'default'
     * ```
     *
     * @see mockClear
     * @since 1.0.0
     */

    mockReset(): this {
        this.mockClear();
        this.queuedImplementations = [];

        return this;
    }

    /**
     * Restores the original implementation of the mocked function.
     *
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method performs the most complete reset operation. It first calls mockReset() {@link mockReset}
     * to clear all state and queued implementations, then restores the original implementation
     *  provided when the mock was created. If a custom restore function was provided,
     * it will be used instead to determine the implementation to restore.
     *
     * @example
     * ```ts
     * // Create a mock with an original implementation
     * const originalFn = (x: number) => x * 2;
     * const mockFn = xJet.fn(originalFn);
     *
     * // Override the implementation
     * mockFn.mockImplementation((x: number) => x * 3);
     *
     * console.log(mockFn(5)); // 15
     *
     * // Restore the original implementation
     * mockFn.mockRestore();
     *
     * console.log(mockFn(5)); // 10
     * ```
     *
     * @see mockClear
     * @see mockReset
     *
     * @since 1.0.0
     */

    mockRestore(): this {
        this.mockReset();
        const restore = this.restore?.();
        if (typeof restore === 'function') this.implementation = restore;
        else this.implementation = this.originalImplementation;

        return this;
    }

    /**
     * Returns the current implementation of the mock function.
     *
     * @returns The current mock implementation, or undefined if no implementation exists.
     *
     * @remarks
     * This method returns the current implementation function used by the mock.
     * This could be the default implementation, a custom implementation set via
     * mockImplementation() {@link mockImplementation}, or the original implementation
     * if mockRestore() {@link mockRestore} was called.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn(() => 'default');
     *
     * // Get the default implementation
     * const impl = mockFn.getMockImplementation();
     * console.log(impl()); // 'default'
     *
     * // Change the implementation
     * mockFn.mockImplementation(() => 'new implementation');
     *
     * // Get the new implementation
     * const newImpl = mockFn.getMockImplementation();
     * console.log(newImpl()); // 'new implementation'
     * ```
     *
     * @since 1.0.0
     */

    getMockImplementation(): ImplementationType<F> | undefined {
        return this.implementation;
    }

    /**
     * Returns the next implementation to be used when the mock is called.
     *
     * @returns The next implementation from the queue, or the default implementation if the queue is empty.
     *
     * @remarks
     * This method retrieves and removes the next implementation from the queue of implementations
     * added via mockImplementationOnce() {@link mockImplementationOnce}. If the queue is empty,
     * it returns the default implementation set via mockImplementation() {@link mockImplementation}
     * or the original function.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn(() => 'default');
     * mockFn.mockImplementationOnce(() => 'first call');
     * mockFn.mockImplementationOnce(() => 'second call');
     *
     * const firstImpl = mockFn.getNextImplementation();
     * console.log(firstImpl()); // 'first call'
     *
     * const secondImpl = mockFn.getNextImplementation();
     * console.log(secondImpl()); // 'second call'
     *
     * const defaultImpl = mockFn.getNextImplementation();
     * console.log(defaultImpl()); // 'default'
     * ```
     *
     * @since 1.0.0
     */

    getNextImplementation(): ImplementationType<F> | undefined {
        return this.queuedImplementations.length ? this.queuedImplementations.shift() : this.implementation;
    }

    /**
     * Sets a new implementation for this mock function.
     *
     * @param fn - The function to be used as the mock implementation.
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method sets a persistent implementation that will be used whenever the mock function is called,
     * unless there are queued implementations from mockImplementationOnce() {@link mockImplementationOnce}.
     * The implementation remains until it is replaced by another call to mockImplementation() or restored
     * via mockRestore() {@link mockRestore}.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn();
     *
     * mockFn.mockImplementation((x: number) => x * 2);
     *
     * console.log(mockFn(5)); // 10
     * console.log(mockFn(10)); // 20
     *
     * // Change the implementation
     * mockFn.mockImplementation((x: number) => x * 3);
     *
     * console.log(mockFn(5)); // 15
     * ```
     *
     * @see mockRestore
     * @see mockImplementationOnce
     *
     * @since 1.0.0
     */

    mockImplementation(fn: ImplementationType<F>): this {
        this.implementation = fn;

        return this;
    }

    /**
     * Adds a one-time implementation for this mock function.
     *
     * @param fn - The function to be used as the mock implementation for a single call.
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method queues an implementation that will be used for a single call to the mock function.
     * After being used once, it will be removed from the queue. Multiple implementations can be queued,
     * and they will be used in the order they were added. Once all queued implementations are used,
     * the mock will revert to using the implementation set by mockImplementation() {@link mockImplementation}.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn(() => 'default');
     *
     * mockFn.mockImplementationOnce(() => 'first call')
     *       .mockImplementationOnce(() => 'second call');
     *
     * console.log(mockFn()); // 'first call'
     * console.log(mockFn()); // 'second call'
     * console.log(mockFn()); // 'default'
     * ```
     *
     * @see mockReset
     * @see mockImplementation
     *
     * @since 1.0.0
     */

    mockImplementationOnce(fn: ImplementationType<F>): this {
        this.queuedImplementations.push(fn);

        return this;
    }

    /**
     * Sets a fixed return value for this mock function.
     *
     * @param value - The value to be returned when the mock function is called.
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method is a convenience wrapper around mockImplementation() {@link mockImplementation}
     * that creates an implementation which always returns the same value. It replaces any existing
     * implementation with a function that simply returns the specified value.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn();
     *
     * mockFn.mockReturnValue(42);
     *
     * console.log(mockFn()); // 42
     * console.log(mockFn('anything')); // 42
     * console.log(mockFn({}, [])); // 42
     *
     * // Can be changed
     * mockFn.mockReturnValue('new value');
     * console.log(mockFn()); // 'new value'
     * ```
     *
     * @see mockImplementation
     * @see mockReturnValueOnce
     *
     * @since 1.0.0
     */

    mockReturnValue(value: ReturnType<F>): this {
        this.mockImplementation(() => value);

        return this;
    }

    /**
     * Adds a one-time fixed return value for this mock function.
     *
     * @param value - The value to be returned for a single call to the mock function.
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method is a convenience wrapper around mockImplementationOnce() {@link mockImplementationOnce}
     * that creates a one-time implementation which returns the specified value. Multiple return values
     * can be queued, and they will be used in the order they were added. After all queued values are
     * consumed, the mock will revert to its default implementation.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn(() => 'default');
     *
     * mockFn.mockReturnValueOnce(42)
     *       .mockReturnValueOnce('string value')
     *       .mockReturnValueOnce({ object: true });
     *
     * console.log(mockFn()); // 42
     * console.log(mockFn()); // 'string value'
     * console.log(mockFn()); // { object: true }
     * console.log(mockFn()); // 'default'
     * ```
     *
     * @see mockReturnValue
     * @see mockImplementationOnce
     *
     * @since 1.0.0
     */

    mockReturnValueOnce(value: ReturnType<F>): this {
        this.mockImplementationOnce(() => value);

        return this;
    }

    /**
     * Sets a resolved Promise return value for this mock function.
     *
     * @param value - The value that the Promise will resolve to.
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method is a convenience wrapper that creates an implementation which returns a
     * Promise that resolves to the specified value. It's particularly useful for testing
     * async functions that should return resolved Promises.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn();
     *
     * mockFn.mockResolvedValue('resolved value');
     *
     * // The mock now returns a Promise that resolves to 'resolved value'
     * mockFn().then(result => {
     *   console.log(result); // 'resolved value'
     * });
     *
     * // Can also be used with async/await
     * const result = await mockFn();
     * console.log(result); // 'resolved value'
     * ```
     *
     * @see mockRejectedValue
     * @see mockImplementation
     * @see mockResolvedValueOnce
     *
     * @since 1.0.0
     */

    mockResolvedValue(value: PromiseValueType<ReturnType<F>>): this {
        this.mockImplementation(() => <ReturnType<F>> Promise.resolve(value));

        return this;
    }

    /**
     * Adds a one-time resolved Promise return value for this mock function.
     *
     * @param value - The value that the Promise will resolve to for a single call.
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method is a convenience wrapper that creates a one-time implementation which returns
     * a Promise that resolves to the specified value. Multiple resolved values can be queued and
     * will be used in the order they were added. After all queued values are consumed, the mock
     * will revert to its default implementation.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn(() => Promise.resolve('default'));
     *
     * mockFn.mockResolvedValueOnce('first call')
     *       .mockResolvedValueOnce('second call')
     *       .mockResolvedValueOnce('third call');
     *
     * // Each call returns a different Promise
     * await expect(mockFn()).resolves.toEqual('first call');
     * await expect(mockFn()).resolves.toEqual('second call');
     * await expect(mockFn()).resolves.toEqual('third call');
     * await expect(mockFn()).resolves.toEqual('default');
     * ```
     *
     * @see mockResolvedValue
     * @see mockRejectedValueOnce
     * @see mockImplementationOnce
     *
     * @since 1.0.0
     */

    mockResolvedValueOnce(value: PromiseValueType<ReturnType<F>>): this {
        this.mockImplementationOnce(() => <ReturnType<F>> Promise.resolve(value));

        return this;
    }

    /**
     * Sets a rejected Promise return value for this mock function.
     *
     * @param value - The error that the Promise will reject with.
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method is a convenience wrapper that creates an implementation which returns a
     * Promise that rejects with the specified value. It's particularly useful for testing
     * error handling in async functions.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn();
     *
     * mockFn.mockRejectedValue(new Error('Something went wrong'));
     *
     * // The mock now returns a Promise that rejects with the error
     * mockFn().catch(error => {
     *   console.error(error.message); // 'Something went wrong'
     * });
     *
     * // Can also be used with async/await and try/catch
     * try {
     *   await mockFn();
     * } catch (error) {
     *   console.error(error.message); // 'Something went wrong'
     * }
     * ```
     *
     * @see mockResolvedValue
     * @see mockImplementation
     * @see mockRejectedValueOnce
     *
     * @since 1.0.0
     */

    mockRejectedValue(value: PromiseValueType<ReturnType<F>>): this {
        this.mockImplementation(() => <ReturnType<F>> Promise.reject(value));

        return this;
    }

    /**
     * Adds a one-time rejected Promise return value for this mock function.
     *
     * @param value - The error that the Promise will reject with for a single call.
     * @returns The mock instance for method chaining.
     *
     * @remarks
     * This method is a convenience wrapper that creates a one-time implementation which returns
     * a Promise that rejects with the specified value. Multiple rejected values can be queued and
     * will be used in the order they were added. After all queued values are consumed, the mock
     * will revert to its default implementation.
     *
     * @example
     * ```ts
     * const mockFn = xJet.fn(() => Promise.resolve('success'));
     *
     * mockFn.mockRejectedValueOnce(new Error('first error'))
     *       .mockRejectedValueOnce(new Error('second error'));
     *
     * // First call rejects with 'first error'
     * await expect(mockFn()).rejects.toThrow('first error');
     *
     * // Second call rejects with 'second error'
     * await expect(mockFn()).rejects.toThrow('second error');
     *
     * // Third call uses the default implementation and resolves
     * await expect(mockFn()).resolves.toEqual('success');
     * ```
     *
     * @see mockRejectedValue
     * @see mockResolvedValueOnce
     * @see mockImplementationOnce
     *
     * @since 1.0.0
     */

    mockRejectedValueOnce(value: PromiseValueType<ReturnType<F>>): this {
        this.mockImplementationOnce(() => <ReturnType<F>> Promise.reject(value));

        return this;
    }

    /**
     * Custom inspection method for Node.js util.inspect().
     *
     * @returns A string representation of this mock constructor.
     *
     * @remarks
     * This method implements the Node.js custom inspection protocol by using the
     * Symbol.for('nodejs.util.inspect.custom') symbol. When the mock is inspected
     * using util.inspect() or displayed in a Node.js REPL, this custom string
     * representation will be used instead of the default object inspection.
     *
     * @example
     * ```ts
     * const mockConstructor = xJet.fn();
     * console.log(mockConstructor); // Outputs: <Mock Constructor undefined>
     *
     * const namedMock = xJet.fn().mockName('myMock');
     * console.log(namedMock); // Outputs: <Mock Constructor myMock>
     * ```
     *
     * @see https://nodejs.org/api/util.html#util_custom_inspection_functions_on_objects
     *
     * @since 1.0.0
     */

    [Symbol.for('nodejs.util.inspect.custom')](): string {
        return `<Mock Constructor ${ this.name }>`;
    }

    /**
     * Initializes the internal state object for the mock function.
     *
     * @returns A new mock state object with default empty values.
     *
     * @remarks
     * This private method creates and returns a fresh state object used to track
     * mock function invocations. The state includes:
     * - calls: Arguments passed to the mock function
     * - results: Return values or errors from each call
     * - lastCall: Arguments from the most recent call
     * - contexts: 'this' context values for each call
     * - instances: Objects created when the mock is used as a constructor
     * - invocationCallOrder: Tracking the sequence of calls across multiple mocks
     *
     * This method is used internally when creating a new mock or when resetting
     * an existing mocks state.
     *
     * @since 1.0.0
     */

    private initState(): MocksStateInterface<F> {
        return {
            calls: [],
            results: [],
            lastCall: undefined,
            contexts: [],
            instances: [],
            invocationCallOrder: []
        };
    }

    /**
     * Invokes the mock function with the provided arguments and context.
     *
     * @param thisArg - The 'this' context for the function call
     * @param args - The arguments to pass to the function
     * @returns The result of the mock implementation or undefined
     *
     * @remarks
     * This private method handles the actual invocation of the mock function and manages all
     * state trackings.
     *
     * This method is central to the mock's functionality, enabling call tracking,
     * result recording, and the execution of custom implementations.
     *
     * @since 1.0.0
     */

    private invoke(thisArg: ThisParameterType<F>, args: Parameters<F>): ReturnType<F> | undefined {
        let thisContext = thisArg;
        const impl = <FunctionType & BoundInterface> this.getNextImplementation();

        const argsArray = <Parameters<F>> args;
        if (typeof impl === 'function') {
            if (impl.__boundArgs) argsArray.unshift(...impl.__boundArgs);
            if (impl.__boundThis) thisContext = <ThisParameterType<F>> impl.__boundThis;
        }

        this.state.calls.push(argsArray);
        this.state.contexts.push(<ThisParameterType<F>> thisContext);
        this.state.invocationCallOrder.push(this.state.invocationCallOrder.length + 1);

        let result: MockInvocationResultInterface<ReturnType<F>>;
        const index = this.state.results.push({ value: undefined, type: 'incomplete' }) - 1;

        if (impl) {
            try {
                const value = impl.call(<ThisParameterType<F>> undefined, ...args);
                result = { type: 'return', value };
            } catch (error) {
                result = { value: error, type: 'throw' };
            }
        } else {
            result = { type: 'return', value: undefined };
        }

        this.state.lastCall = args;
        this.state.results[index] = result;

        return <ReturnType<F>> result.value;
    }

    /**
     * Handles property access for the mock function proxy.
     *
     * @param target - The mock function instance
     * @param property - The property name or symbol being accessed
     * @returns The property value from either the mock or the original implementation
     *
     * @remarks
     * This private method is used as the 'get' trap for the Proxy surrounding the mock function.
     * It provides property access fallback behavior - first checking if the property exists
     * on the mock itself, and if not, retrieving it from the original implementation.
     *
     * This enables the mock to maintain its own properties while still allowing access to
     * properties from the original function, providing a more transparent mocking experience.
     *
     * @since 1.0.0
     */

    private invokeGet(target: this, property: string | symbol): unknown {
        const isProperty = Reflect.has(target, property);
        if (isProperty) return Reflect.get(target, property);

        return Reflect.get(target.originalImplementation, property);
    }

    /**
     * Handles constructor invocation when the mock is used with 'new'.
     *
     * @param target - The mock function instance
     * @param argArray - The arguments passed to the constructor
     * @param newTarget - The constructor that was directly invoked
     * @returns The constructed instance
     *
     * @remarks
     * This method is used as the 'construct' trap for the Proxy surrounding the mock function.
     * It delegates to the `invoke` method to handle the actual function call, then tracks the
     * resulting instance in the mock's state for later verification.
     *
     * The method handles both cases where the constructor returns an object (which becomes the
     * instance) and where it doesn't (in which case the newTarget becomes the instance).
     *
     * @since 1.0.0
     */

    private invokeClass(target: this, argArray: Parameters<F>, newTarget: object): object {
        const result = target.invoke.call(target, <ThisParameterType<F>> newTarget, argArray);
        const isClassInstance = typeof result === 'object' && result !== null && 'constructor' in result;
        target.state.instances.push(isClassInstance ? <ThisParameterType<F>> result : <ThisParameterType<F>> newTarget);

        return typeof result === 'object' ? <object> result : newTarget;
    }

    /**
     * Handles function invocation when the mock is called.
     *
     * @param target - The mock function instance
     * @param thisArg - The 'this' context for the function call
     * @param argumentsList - The arguments passed to the function
     * @returns The result of the function invocation
     *
     * @remarks
     * This method is used as the 'apply' trap for the Proxy surrounding the mock function.
     * It captures the calling context in the mock's state for later verification, then
     * delegates to the `invoke` method to handle the actual function call logic.
     *
     * This method is called whenever the mock function is invoked as a regular function
     * (not as a constructor).
     *
     * @since 1.0.0
     */

    private invokeFunction(target: this, thisArg: ThisParameterType<F>, argumentsList: Parameters<F>): ReturnType<F> | undefined {
        target.state.instances.push(thisArg);

        return target.invoke.call(target, thisArg, argumentsList);
    }
}
