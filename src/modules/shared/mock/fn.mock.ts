/**
 * Import will remove at compile time
 */

import type { MockableFunctionInterface } from '@shared/mock/interfaces/fn-mock.interface';
import type { ConstructorLikeType, FunctionLikeType, FunctionType } from '@remotex-labs/xjet-expect';

/**
 * Imports
 */

import { MockState } from '@shared/states/mock.state';
import { ExecutionError } from '@shared/errors/execution.error';
import { deepSearchObject, getOwnProperty } from '@shared/components/object.component';

/**
 * Creates a mock for an object property using property descriptors.
 *
 * @template T - The type of the target object containing the property to mock
 *
 * @param target - The object containing the property to mock
 * @param key - The name of the property to mock
 * @returns A {@link MockState} instance that tracks interactions with the property
 *
 * @remarks
 * The `mockDescriptorProperty` function replaces a property on a target object with a getter/setter
 * that intercepts access to that property. This allows for monitoring and controlling property
 * access during tests. The original property can be restored later through the mock's
 * restore capability.
 *
 * Responsibilities:
 * - Intercepting property access via custom property descriptors
 * - Capturing the original property value and descriptor
 * - Creating a {@link MockState} instance to track interactions
 * - Supporting property restoration through the {@link MockState.mockRestore} method
 * - Maintaining references in the global {@link MockState.mocks} registry
 *
 * @example
 * ```ts
 * // Mock a property on an object
 * const obj = { value: 42 };
 * const mockValue = mockDescriptorProperty(obj, 'value');
 * ```
 *
 * @see MockState
 * @since 1.2.0
 */

export function mockDescriptorProperty<T extends object>(target: T, key: string | number | symbol): MockState {
    const original = Reflect.get(<object> target, key);
    const originalDescriptor = Object.getOwnPropertyDescriptor(target, key) || {};
    const mockInstance = new MockState(() => original, () => {
        Reflect.set(target, key, originalDescriptor.value);
        Object.defineProperty(target, key, originalDescriptor);
    }, 'xJet.spyOn()');

    MockState.mocks.add(new WeakRef(mockInstance));
    Object.defineProperty(target, key, {
        get() {
            return mockInstance.apply(this, []);
        },
        set(value: unknown) {
            mockInstance.mockImplementation(() => value);

            return mockInstance.apply(this, [ value ]);
        }
    });

    return mockInstance;
}

/**
 * Creates a mock function interface with the specified implementation and optional restore function.
 *
 * @template ReturnType - The return type of the mocked function.
 * @template Args - The argument type of the mocked function. Defaults to an array of unknown values.
 * @template Context - The context type that the mocked function binds to.
 *
 * @param implementation - An optional implementation of the mocked function.
 * @param restore - An optional restore function used to reset the mock.
 * @returns A mocked function interface with the specified behaviors.
 *
 * @remarks
 * The `fnImplementation` function creates a mock function handler, typically used in testing scenarios.
 * It transforms regular functions into mockable objects that can be monitored and controlled.
 *
 * Responsibilities:
 * - Creating mock functions with custom implementations
 * - Supporting restore functionality for resetting mocks
 * - Providing type-safe mock interfaces via {@link MockableFunctionInterface}
 * - Integrating with the {@link MockState} system
 *
 * @example
 * ```ts
 * // Creating a mock with a custom implementation
 * const mock = xJet.fn((x: number) => x * 2);
 * console.log(mock(5)); // 10
 *
 * // Creating a mock with a restore function
 * const mockWithRestore = xJet.fn(undefined, () => { console.log('Restored!'); });
 * mockWithRestore.restore(); // "Restored!"
 * ```
 *
 * @see MockState
 * @see MockableFunctionInterface
 * @see FunctionLikeType
 *
 * @since 1.2.0
 */

export function fnImplementation<ReturnType, Args extends Array<unknown>, Context>(
    implementation?: FunctionLikeType<ReturnType, Args, Context>,
    restore?: () => FunctionLikeType<ReturnType, Args, Context> | void
): MockableFunctionInterface<FunctionLikeType<ReturnType, Args, Context>> {
    return <MockableFunctionInterface<FunctionLikeType<ReturnType, Args, Context>>>
        new MockState(implementation, restore, 'xJet.fn()');
}

/**
 * Creates a mock implementation of the provided class constructor.
 *
 * @param method - The class constructor to mock
 * @param implementation - Optional custom implementation of the mocked constructor
 * @returns The mock state associated with the mocked constructor
 *
 * @remarks
 * This overload of the mockImplementation function is specifically designed for mocking class constructors.
 * It allows for replacing a class implementation during testing while tracking instantiation.
 *
 * The implementation function can return a partial instance of the class, which will be used
 * as the constructed object when the mock is called with 'new'.
 *
 * @example
 * ```ts
 * class User {
 *   name: string;
 *   age: number;
 *   constructor (name: string, age: number) {
 *     this.name = name;
 *     this.age = age;
 *   }
 * }
 *
 * const MockUser = mockImplementation(User, (name, age) => ({ name, age: age + 1 }));
 * const user = new MockUser('Alice', 30); // user.age === 31
 * MockUser.verify.called(); // passes
 * ```
 *
 * @since 1.2.2
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockImplementation<F extends abstract new (...args: any) => any>(
    method: F,
    implementation?: (...args: ConstructorParameters<F>) => Partial<InstanceType<F>>
): MockState<(...args: ConstructorParameters<F>) => Partial<InstanceType<F>>>;

/**
 * Creates a mock implementation of the provided function.
 *
 * @param method - The function to mock
 * @param implementation - Optional custom implementation that returns a partial result
 * @returns The mock state associated with the mocked function
 *
 * @remarks
 * This overload of the mockImplementation function allows for providing an implementation
 * that returns a partial result object. This is particularly useful when mocking functions
 * that return complex objects where only specific properties are relevant for testing.
 *
 * The implementation preserves the 'this' context from the original function, allowing
 * for proper method mocking on objects.
 *
 * @example
 * ```ts
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * function getUser(id: number): User {
 *   // real implementation
 *   return { id, name: 'Real User', email: 'user@example.com' };
 * }
 *
 * const mockGetUser = mockImplementation(getUser, (id) => ({ id, name: 'Mock User' }));
 * const user = mockGetUser(123); // { id: 123, name: 'Mock User' }
 * ```
 *
 * @since 1.2.2
 */

export function mockImplementation<F extends FunctionType>(
    method: F,
    implementation?: (...args: Parameters<F>) => Partial<ReturnType<F>>
): MockState<(this: ThisParameterType<F>, ...args: Parameters<F>) => Partial<ReturnType<F>>>;

/**
 * Creates a mock for an element with an optional custom implementation.
 *
 * @template Element - The type of the element being mocked
 *
 * @param item - The element to mock
 * @param implementation - Optional custom implementation to replace the original element's behavior
 * @returns A {@link MockState} instance that controls and tracks the mock
 *
 * @remarks
 * The `mockImplementation` function creates a new {@link MockState} instance that wraps
 * around the provided element, allowing you to observe interactions with it and optionally
 * override its behavior. This is useful for isolating components during testing by
 * replacing their dependencies with controlled mocks.
 *
 * Responsibilities:
 * - Creating a trackable mock from any element
 * - Supporting custom implementation substitution
 * - Maintaining type safety between the original and mocked elements
 * - Enabling interaction tracking and verification capabilities
 * - Providing a fluent API for configuring mock behavior
 *
 * @example
 * ```ts
 * // Mock a simple value like export const testValue = 'original value'
 * const mockValue = xJet.mock(testValue);
 * mockValue.mockReturnValue("mocked value");
 *
 * // Mock a function
 * const originalFn = (name: string) => `Hello, ${name}!`;
 * const mockedFn = xJet.mock(originalFn);
 *
 * // Configure custom implementation
 * mockedFn.mockImplementation((name: string) => `Hi, ${name}!`);
 *
 * test ('uses mocked function', () => {
 *   const result = xJet.mock(testValue);
 *   expect(result).toBe('Hi, World!');
 *   expect(mockedFn).toHaveBeenCalledWith('World');
 * });
 * ```
 *
 * @see MockState
 * @see FunctionLikeType
 *
 * @since 1.2.0
 */

export function mockImplementation<Element = unknown>(
    item: Element,
    implementation?: () => Element
): MockState<() => Element>;

/**
 * Creates a mock for an item with an optional custom implementation.
 *
 * @param element - The element to mock
 * @param implementation - Optional custom implementation to replace the original item's behavior
 * @returns A {@link MockState} instance that controls and tracks the mock
 *
 * @remarks
 * The `mockImplementation` function creates a new {@link MockState} instance that wraps
 * around the provided item, allowing you to monitor interactions with it and optionally
 * override its implementation. This is particularly useful for testing components that
 * depend on external objects or functions by providing controlled behavior during tests.
 *
 * Responsibilities:
 * - Creating a trackable mock from any item (function, constructor, or value)
 * - Supporting custom implementation override capability
 * - Handling special cases for constructors with non-writable prototypes
 * - Enabling call tracking and verification functionality
 * - Maintaining the original reference in the parent object for restoration
 *
 * @example
 * ```ts
 * // Mock a function
 * const fetchData = async () => ({ id: 1, name: 'Test' });
 * const mockedFetch = xJet.mock(fetchData);
 *
 * // Mock with custom implementation
 * const mockedFetchCustom = xJet.mock(fetchData, async () => {
 *   return { id: 2, name: 'Custom Test' };
 * });
 * ```
 *
 * @see MockState
 * @see FunctionLikeType
 * @see ConstructorLikeType
 *
 * @since 1.2.0
 */

export function mockImplementation(element: unknown, implementation?: FunctionType): MockState {
    if (!element) throw new ExecutionError('xJet.mock element is not defined');
    if (typeof element === 'function' && (element as MockState).xJetMock) return <MockState> element;

    const findObject = deepSearchObject(globalThis, element, (<FunctionType> element)?.name);
    if (!findObject) {
        throw new ExecutionError(
            'Unable to mock this item: it was not found in any global object.\n' +
            'If you are trying to mock a Proxy object, please use xJet.spyOn() instead.'
        );
    }

    const { parent, key } = getOwnProperty(findObject.parent, findObject.key);
    const method = Reflect.get(parent, key);

    if (typeof method === 'function' && method.prototype && !Object.getOwnPropertyDescriptor(method, 'prototype')?.writable) {
        const mock = new MockState(
            (...args: Array<unknown>) => {
                return new (method as ConstructorLikeType<unknown, Array<unknown>>)(...args);
            },
            () => {
                Reflect.set(parent, key, method);
            }
        );

        Reflect.set(parent, key, mock);
        MockState.mocks.add(new WeakRef(mock));
        if (implementation) mock.mockImplementation(implementation);

        return mock;
    }

    if (typeof method === 'function') {
        const mock = new MockState(<FunctionType> method, () => {
            Reflect.set(parent, key, method);
        });

        Reflect.set(parent, key, mock);
        MockState.mocks.add(new WeakRef(mock));
        if (implementation) mock.mockImplementation(implementation);

        return mock;
    }

    const mock = mockDescriptorProperty(parent, key);
    if (implementation) mock.mockImplementation(implementation);

    return mock;
}
