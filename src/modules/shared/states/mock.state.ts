/**
 * Import will remove at compile time
 */

import type { BoundInterface } from '@shared/components/interfaces/polyfill-component.interface';
import type { FunctionLikeType, RejectedValueType, ResolvedValueType } from '@remotex-labs/xjet-expect';
import type { MockInvocationResultInterface, MocksStateInterface } from './interfaces/mock-state.interface';

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
 * A class representing the mock state for tracking and managing the behavior of mocked functions or classes.
 *
 * @template ReturnType - The type of value returned by the mock function.
 * @template Context - The type representing the context (`this` value) used in the mock function.
 * @template Args - The types of arguments for the mocked function.
 *
 * @remarks
 * This class provides mechanisms to customize and manage the behavior of mocked functions or constructors.
 * It tracks invocation details, allows for behavior customization, and enables resetting or restoring the mock to its original state.
 *
 * @since v1.0.0
 */

export class MockState<ReturnType = unknown, Args extends Array<unknown> = unknown[], Context = unknown> extends Function {
    /**
     * List of all mocks that created
     */

    static mocks: Array<MockState> = [];

    /**
     * The `name` property represents the name of the mock function.
     */

    override name: string;

    /**
     * Flag to detect mock functions
     */

    readonly xJetMock: boolean = true;

    /**
     * The `state` property holds the detailed state of the mock invocations.
     * It tracks information such as the arguments passed, the results returned, the context (`this` value) used,
     * the instances created, and the order of invocations.
     * This data is automatically updated after each call to the mock.
     *
     * @template ReturnType - The type of value returned by the mock function.
     * @template Context - The type representing the context (`this` value) used in the mock function.
     * @template Args - The types of arguments for the mocked function.
     *
     * @see MocksStateInterface
     *
     * @since v1.0.0
     */

    private state: MocksStateInterface<ReturnType, Args, Context>;

    /**
     * A private function that restores the mocks original implementation.
     * It resets the mock to its initial state, typically used when restoring
     * the mock after a call to `mockReset` or `mockRestore`.
     *
     * This function is invoked internally to ensure that the mock behaves as
     * originally defined before any changes were made to its behavior or implementation.
     *
     * @since v1.0.0
     */

    private readonly restore: FunctionLikeType<void>;

    /**
     * A private array that stores the implementations queued to be executed
     * for future invocations of the mock.
     * Each function in this array is invoked in sequence when the mock function is called,
     * with the first queued implementation being used on the first call, the second on the second call, and so on.
     *
     * This property is used in conjunction with methods like `mockImplementationOnce`
     * to specify different behaviors for consecutive calls to the mock.
     *
     * @since v1.0.0
     */

    private queuedImplementations: Array<FunctionLikeType<ReturnType, Args, Context>> = [];

    /**
     * A private property that holds the current implementation of the mock function.
     * This function is executed whenever the mock is invoked and can be changed
     * using methods like `mockImplementation` or `mockImplementationOnce`.
     *
     * The `implementation` allows for customizing the behavior of the mock,
     * such as returning specific values, throwing errors, or performing actions.
     *
     * @since v1.0.0
     */

    private implementation: FunctionLikeType<ReturnType, Args, Context> | undefined;

    /**
     * A private property that holds the original implementation of the mock function.
     * This is the initial function passed to the constructor that defines the mock's default behavior
     * before any customization.
     *
     * @template ReturnType - The type of value returned by the original function.
     * @template Args - The types of arguments for the original function.
     * @template Context - The type representing the context (`this` value) used in the original function.
     *
     * @remarks
     * This property stores the initial implementation provided when creating the mock.
     * If no implementation is provided during construction, it defaults to a function
     * that returns `undefined` cast to the appropriate return type.
     * Unlike `implementation` which can be modified, this property maintains a reference
     * to the original function for scenarios where the original behavior needs to be preserved
     * or restored.
     *
     * @see FunctionLikeType
     * @see MockState.original
     *
     * @since 1.0.0
     */

    private readonly originalImplementation: FunctionLikeType<ReturnType, Args, Context>;

    /**
     * Constructs a mock object that allows custom implementation, restore capability,
     * and optional naming functionality. This mock is proxied to handle function invocation
     * and class instantiation.
     *
     * @template ReturnType - The type of the value returned by the mock function.
     * @template Context - The type of the context (`this`) for the mock function.
     * @template Args - The type of arguments accepted by the mock function.
     *
     * @param implementation - Optional implementation for the mock function.
     * @param restore - Optional function to restore the mock to its initial state. Defaults to resetting to the provided implementation.
     * @param name - Optional name for the mock instance. Default to a predefined mock name if not provided.
     *
     * @returns A proxied mock object capable of behaving as a callable function or a constructible class.
     *
     * @remarks
     * The mock object can work as both a function and a class, using JavaScript's Proxy API. The restore functionality
     * allows resetting to the original state or implementation. If no implementation is provided, the mock remains uninitialized
     * but still functional.
     *
     * @see FunctionLikeType
     * @see VoidFunctionType
     *
     * @since 1.0.0
     */

    constructor(implementation?: FunctionLikeType<ReturnType, Args, Context>, restore?: FunctionLikeType<void>, name?: string) {
        super();
        this.name = name ?? DEFAULT_MOCK_NAME;
        this.state = this.initState();
        this.implementation = implementation;
        this.restore = restore ? restore : (): void => {
            this.implementation = implementation;
        };

        this.originalImplementation = implementation || ((): ReturnType => undefined as unknown as ReturnType);

        return <this> new Proxy(this, {
            apply: this.invokeFunction,
            construct: <ProxyHandler<object>['construct']> this.invokeClass
        });
    }

    /**
     * todo remove it
     * only for jest expect will support this mock
     */

    getMockName(): string {
        return this.name;
    }

    /**
     * Retrieves the current state of mocks.
     *
     * @return The current state of the mocks.
     * @see MocksStateInterface
     *
     * @since 1.0.0
     */

    get mock(): Readonly<MocksStateInterface<ReturnType, Args, Context>> {
        return this.state;
    }

    /**
     * Returns the original implementation of the function that was instrumented
     *
     * @returns The original function implementation that was wrapped or modified
     *
     * @remarks
     * This getter provides access to the unmodified function that was originally passed
     * to the instrumentation system. Useful for debugging, testing, or when you need
     * to bypass the instrumented behavior temporarily.
     *
     * @example
     * ```ts
     * const mockFn = jest.fn(x => x * 2);
     * // Later in test
     * const originalImplementation = mockFn.original;
     * expect(originalImplementation(5)).toBe(10);
     * ```
     *
     * @see FunctionLikeType
     *
     * @since 1.0.0
     */

    get original(): FunctionLikeType<ReturnType, Args, Context> {
        return this.originalImplementation;
    }

    /**
     * Clears the `mock.calls`, `mock.results`, `mock.contexts`, `mock.instances`, and `mock.invocationCallOrder` properties.
     *
     * @returns The current instance of the mock, allowing for method chaining.
     *
     * @remarks
     * This method resets the state of the mock function, clearing all invocation data and results,
     * ensuring that previous mock states do not affect the following tests.
     * Equivalent to calling `.mockClear()` on every mocked function.
     *
     * @see MockState.initState
     *
     * @since v1.0.0
     */

    mockClear(): this {
        this.state = this.initState();

        return this;
    }

    /**
     * Resets the mock function to its initial state.
     *
     * @returns The current instance of the mock, allowing for method chaining.
     *
     * @remarks
     * The `mockReset` method clears all invocation data and results by calling `mockClear()` and also resets
     * the queued implementations,
     * removing any previously queued behavior set by methods like `mockImplementationOnce`.
     * This ensures that the mock is in a clean state and ready for new invocations or configurations.
     *
     * @see MockState.mockClear
     *
     * @since v1.0.0
     */

    mockReset(): this {
        this.mockClear();
        this.queuedImplementations = [];

        return this;
    }

    /**
     * Restores the mock function to its original implementation and resets its state.
     *
     * @returns The current instance of the mock, allowing for method chaining.
     *
     * @remarks
     * The `mockRestore` method does two things:
     * 1. It restores the mock to its initial implementation, which was set during the mocks creation or
     *    via the `mockImplementation` method.
     * 2. It clears all tracking data, such as calls, results, contexts, instances, and invocation call order
     *    by calling `mockReset()`, ensuring the mock is fully reset and ready for new invocations.
     *
     * This method is useful for ensuring that the mock is completely restored and cleared, making it behave as it did
     * when it was first created or last restored.
     *
     * @see MockState.restore
     * @see MockState.mockReset
     *
     * @since v1.0.0
     */

    mockRestore(): this {
        this.restore();
        this.mockReset();

        const index = MockState.mocks.indexOf(<MockState> <unknown> this);
        if (index !== -1) {
            MockState.mocks.splice(index, 1);
        }

        return this;
    }

    /**
     * Retrieves the mock implementation for a function, if available.
     *
     * @template ReturnType The type the return value of the function.
     * @template Context The type of the `this` context for the function.
     * @template Args The type the argument(s) of the function.
     *
     * @return A function matching `FunctionLikeType` that represents the mock implementation,
     * or `undefined` if no implementation is set.
     *
     * @remarks
     * This method returns the mock implementation associated with the instance.
     * If no mock implementation exists, it returns `undefined`.
     *
     * @since 1.0.0
     */

    getMockImplementation(): FunctionLikeType<ReturnType, Args, Context> | undefined {
        return this.implementation;
    }

    /**
     * Retrieves the next implementation from the queued implementations or defaults to the current implementation.
     *
     * @template ReturnType The return type of the function-like implementation.
     * @template Context     The context in which the implementation executes.
     * @template Args        The argument types expected by the implementation.
     *
     * @return The next implementation from the queue if available, or the current implementation.
     * Returns are `undefined` if no implementation is found.
     *
     * @remarks
     * This method first checks if there are any queued implementations available.
     * If a queued implementation exists, it will be removed from the queue and returned.
     * If the queue is empty, the primary current implementation is returned.
     * Returns are `undefined` if there is no implementation available.
     *
     * @since 1.0.0
     */

    getNextImplementation(): FunctionLikeType<ReturnType, Args, Context> | undefined {
        return this.queuedImplementations.length ? this.queuedImplementations.shift() : this.implementation;
    }

    /**
     * Replaces the default implementation of a mock function with the provided function.
     *
     * @template ReturnType - The type of the value returned by the implementation function.
     * @template Context - The context (`this`) expected by the implementation function.
     * @template Args - The types of the arguments expected by the implementation function.
     *
     * @param fn - The function to be used as the mock implementation. It defines
     * the behavior of the mock when called.
     *
     * @return Returns the instance of the current object for method chaining.
     *
     * @remarks
     * This method is useful when you need to mock the behavior of a function
     * dynamically during tests or in controlled scenarios.
     *
     * @since 1.0.0
     */

    mockImplementation(fn: FunctionLikeType<ReturnType, Args, Context>): this {
        this.implementation = fn;

        return this;
    }

    /**
     * Sets a mock implementation that will be used once for the next call to the mocked function.
     *
     * @template ReturnType The type of the value that the mock function will return.
     * @template Context The type of the `this` context for the mock function.
     * @template Args The type of arguments that the mock function will receive.
     *
     * @param fn - The function to be used as the mock implementation for the next call.
     * @returns The current instance, allowing for chaining of mock configurations.
     *
     * @remarks
     * The provided mock implementation will only be executed once. Further calls will fall back
     * to a different implementation, if provided, or the default behavior of the mock function.
     *
     * @example
     * ```ts
     * const mockFn = new MockState();
     *
     * // Set default implementation
     * mockFn.mockImplementation(() => 'default');
     *
     * // Set one-time behavior for the next call
     * mockFn.mockImplementationOnce(() => 'first call');
     *
     * console.log(mockFn()); // Output: 'first call' (from mockImplementationOnce)
     * console.log(mockFn()); // Output: 'default' (from mockImplementation)
     * ```
     *
     * @see FunctionLikeType
     *
     * @since 1.0.0
     */

    mockImplementationOnce(fn: FunctionLikeType<ReturnType, Args, Context>): this {
        this.queuedImplementations.push(fn);

        return this;
    }

    /**
     * Sets a mock implementation to always return a specified value when invoked.
     *
     * @template ReturnType The type of the value returned by the mock implementation.
     *
     * @param value - The value to always return when the mock function is called.
     * @return The current instance for chaining.
     *
     * @remarks
     * This method overrides any previous mock implementation configured for the function.
     *
     * @example
     * ```ts
     * const mockFn = new MockState();
     *
     * // Set mock to return 'Hello World' on each call
     * mockFn.mockReturnValue('Hello World');
     *
     * console.log(mockFn()); // Output: 'Hello World'
     * console.log(mockFn()); // Output: 'Hello World'
     * ```
     *
     * @since 1.0.0
     */

    mockReturnValue(value: ReturnType): this {
        this.mockImplementation(() => value);

        return this;
    }

    /**
     * Sets up a mock function to always resolve a promise with the specified value when called.
     *
     * @template ResolvedValueType - The type of the value to be resolved by the promise.
     * @template ReturnType - The return type of the function, which should include a Promise of the specified resolved value type.
     *
     * @param value - The value to be returned as the resolved value of the promise.
     * @returns The mock function instance, enabling method chaining.
     *
     * @remarks
     * This method is particularly useful for mocking asynchronous functions that return promises.
     * It ensures that the mock function resolves with the provided value every time it is called.
     *
     * @example
     * ```ts
     * const mockFn = new MockState<Promise<string>>();
     *
     * // Set mock to return a resolved promise with the value 'Success'
     * mockFn.mockResolvedValue('Success');
     *
     * mockFn().then((result: string) => {
     *     console.log(result); // Output: 'Success'
     * });
     * ```
     *
     * @since 1.0.0
     */

    mockResolvedValue(value: ResolvedValueType<ReturnType>): this {
        this.mockImplementation(() => <ReturnType> Promise.resolve(value));

        return this;
    }

    /**
     * Sets a mock implementation for a single call that resolves to the specified value.
     *
     * @template ReturnType The type of the resolved value.
     * @template ResolvedValueType The type of the input value to be resolved.
     *
     * @param value - The value that the promise should resolve with when the mock is called once.
     * @return The current mock object instance, enabling method chaining.
     *
     * @remarks
     * This method is useful for defining custom behavior for a specific invocation of a mocked function,
     * returning a resolved promise with the provided value.
     *
     * @example
     * ```ts
     * const mockFn = new MockState(async () => {
     *     return 'end';
     * });
     *
     * // Set mock to return a resolved promise with the value 'Success'
     * mockFn.mockResolvedValueOnce('Success');
     *
     * mockFn().then((result: string) => {
     *     console.log(result); // Output: 'Success'
     * });
     *
     * mockFn().then((result: string) => {
     *     console.log(result); // Output: 'end'
     * });
     * ```
     *
     * @since 1.0.0
     */

    mockResolvedValueOnce(value: ResolvedValueType<ReturnType>): this {
        this.mockImplementationOnce(() => <ReturnType> Promise.resolve(value));

        return this;
    }

    /**
     * Sets the return value of the mock function for a single call.
     *
     * @template ReturnType The type of the value to be returned.
     *
     * @param value - The value to be returned by the mock function for the next call.
     * @return The mock function instance, allowing for method chaining.
     *
     * @remarks
     * This method only affects the return value for the next call to the mock function.
     * All further calls will use the usual mock implementation or other specified behaviors.
     *
     * @example
     * ```ts
     * const mockFn = new MockState();
     *
     * // Set default return value
     * mockFn.mockReturnValue('Default Value');
     *
     * // Set a one-time return value for the next call
     * mockFn.mockReturnValueOnce('First Call');
     * mockFn.mockReturnValueOnce('Second Call');
     *
     * console.log(mockFn()); // Output: 'First Call' (from mockReturnValueOnce)
     * console.log(mockFn()); // Output: 'Second Call' (from mockReturnValueOnce)
     * console.log(mockFn()); // Output: 'Default Value' (from mockReturnValue)
     * ```
     *
     * @since 1.0.0
     */

    mockReturnValueOnce(value: ReturnType): this {
        this.mockImplementationOnce(() => value);

        return this;
    }

    /**
     * Mocks the method to always return a rejected Promise with the specified value.
     *
     * @template ReturnType - The expected type of the return value for the mocked method.
     * @template RejectedValueType - The type of the value used to reject the Promise.
     *
     * @param value - The value with which the mocked Promise will be rejected.
     *
     * @return The current instance of the mock for chaining purposes.
     *
     * @remarks
     * This method is useful for testing scenarios where the function being mocked
     * is expected to reject with a specific value.
     *
     * @example
     * ```ts
     * const mockFn = new MockState<Promise<string>>();
     *
     * // Set mock to return a rejected promise with the value 'Error'
     * mockFn.mockRejectedValue('Error');
     *
     * mockFn().catch(error => {
     *     console.log(error); // Output: 'Error'
     * });
     * ```
     *
     * @since 1.0.0
     */

    mockRejectedValue(value: RejectedValueType<ReturnType>): this {
        this.mockImplementation(() => <ReturnType> Promise.reject(value));

        return this;
    }

    /**
     * Adds a one-time rejection with the provided value to the mock function.
     *
     * @template ReturnType - The type of the value the mock function would return.
     *
     * @param value - The value to reject the promise with in the mock function.
     * @return The current instance of the mock function, allowing for method chaining.
     *
     * @remarks
     * This method configures a mock function to return a rejected promise with the
     * specified value the next time it is called. After the rejection occurs, the
     * mock function's behavior will revert to the next defined mock behavior, or
     * to the default behavior if no behaviors are defined.
     *
     * @example
     * ```ts
     * const mockFn = new MockState<Promise<string>>();
     *
     * // Set default rejected value
     * mockFn.mockRejectedValue('Default Error');
     *
     * // Set a one-time rejected value for the next call
     * mockFn.mockRejectedValueOnce('First Call Error');
     *
     * mockFn().catch(error => {
     *     console.log(error); // Output: 'First Call Error' (from mockRejectedValueOnce)
     * });
     *
     * mockFn().catch(error => {
     *     console.log(error); // Output: 'Default Error' (from mockRejectedValue)
     * });
     * ```
     *
     * @since 1.0.0
     */

    mockRejectedValueOnce(value: RejectedValueType<ReturnType>): this {
        this.mockImplementationOnce(() => <ReturnType> Promise.reject(value));

        return this;
    }

    // todo: withImplementation

    /**
     * Custom inspection method for the `util.inspect` function.
     *
     * @returns A string representing the mock constructor with the specified `name` property.
     *
     * @remarks
     * This method is triggered when `util.inspect` is invoked on an instance of this class.
     * It provides a customized string representation of the class instance, enhancing debugging
     * and inspection output for developers.
     *
     * @example
     * ```ts
     * const mockFn = new MockState();
     * mockFn.name = 'MyMockFunction';
     *
     * // Inspect the mock function
     * console.log(mockFn); // Output: <Mock Constructor MyMockFunction>
     * ```
     *
     * @since 1.0.0
     */

    [Symbol.for('nodejs.util.inspect.custom')](): string {
        return `<Mock Constructor ${ this.name }>`;
    }

    /**
     * Initializes and returns the state object for mock function tracking.
     *
     * @return An object containing the initialized mock function state.
     *
     * @remarks
     * The state object contains the structure necessary to keep track of
     * calls, results, contexts, instances, and invocation orders of the function.
     *
     * @see MocksStateInterface
     *
     * @since v1.0.0
     */

    private initState(): MocksStateInterface<ReturnType, Args, Context> {
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
     * Invokes the next implementation of a mock function with the provided context and arguments.
     *
     * @template Context The type of `this` context in which the function is invoked.
     * @template Args The type of the arguments passed to the function.
     * @template ReturnType The type of the return value, of the function being invoked.
     *
     * @param thisArg - The context (`this`) in which the function is executed.
     * @param args - The arguments to be passed to the function.
     *
     * @returns The result of the function invocation, which is either the return value, the thrown error, or undefined.
     *
     * @remarks
     * This method simulates the function call for a mocked implementation. It tracks all invocations,
     * including the call order, the provided arguments, and the context. It handles binding, default
     * arguments, and maintains a record of results (either successful returns or thrown errors).
     *
     * @since 1.0.0
     */

    private invoke(thisArg: Context, args: Args): ReturnType | undefined {
        let thisContext = thisArg;
        const impl = <FunctionLikeType<ReturnType, Args, Context> & BoundInterface> this.getNextImplementation();

        const argsArray = <Array<unknown>> args;
        if (typeof impl === 'function') {
            if (impl.__boundArgs) argsArray.unshift(...impl.__boundArgs);
            if (impl.__boundThis) thisContext = <Context> impl.__boundThis;
        }

        this.state.calls.push(<Args> argsArray);
        this.state.contexts.push(<Context> thisContext);
        this.state.invocationCallOrder.push(this.state.invocationCallOrder.length + 1);

        let result: MockInvocationResultInterface<ReturnType>;
        const index = this.state.results.push({ value: undefined, type: 'incomplete' }) - 1;

        if (impl) {
            try {
                const value = impl.call(<Context> undefined, ...args);
                result = { type: 'return', value };
            } catch (error) {
                result = { value: error, type: 'throw' };
            }
        } else {
            result = { type: 'return', value: undefined };
        }

        this.state.lastCall = args;
        this.state.results[index] = result;

        return <ReturnType> result.value;
    }

    /**
     * Invokes a function within a specific context and with provided arguments.
     *
     * @template Context The type of the context in which the function is invoked.
     * @template Args The type of the arguments passed to the function.
     * @template ReturnType The type of the value that the invoked function returns.
     *
     * @param target - The instance of the class containing the method to be invoked.
     * @param thisArg - The context object that will be bound to the invoked function.
     * @param argumentsList - The list of arguments to pass to the invoked function.
     * @returns The result of the invoked function or `undefined` if no value is returned.
     *
     * @remarks
     * This method modifies the state of the `target` instance by adding the `thisArg`
     * to the `target.state.instances` array before invoking the function.
     *
     * @since 1.0.0
     */

    private invokeFunction(target: this, thisArg: Context, argumentsList: Args): ReturnType | undefined {
        target.state.instances.push(thisArg);

        return target.invoke.call(target, thisArg, argumentsList);
    }

    /**
     * Invokes a class method on the provided target with specified arguments and a new target.
     *
     * @template Args - The type of arguments to be passed to the invoked method.
     *
     * @param target - The object on which the class method is invoked.
     * @param argArray - The array of arguments to pass to the invoked method.
     * @param newTarget - The new object used as the invocation context.
     * @returns The result of the invocation, typically an object. If the result is not an object,
     *          the `newTarget` is returned instead.
     *
     * @remarks
     * This method ensures that the result is stored in the `instances` array of the target's state
     * if it is detected as a proper class instance. Otherwise, the `newTarget` is registered.
     *
     * @since 1.0.0
     */

    private invokeClass(target: this, argArray: Args, newTarget: object): object {
        const result = target.invoke.call(target, <Context> newTarget, argArray);
        const isClassInstance = typeof result === 'object' && result !== null && result.constructor;
        target.state.instances.push(isClassInstance ? <Context> result : <Context> newTarget);

        return typeof result === 'object' ? <object> result : newTarget;
    }
}
