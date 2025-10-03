/**
 * Import will remove at compile time
 */

import type { FnMockInterface } from '@shared/mock/interfaces/fn-mock.interface';
import type { ConstructorLikeType, FunctionLikeType } from '@remotex-labs/xjet-expect';

/**
 * Imports
 */

import { MockState } from '@shared/states/mock.state';
import { ExecutionError } from '@shared/errors/execution.error';

/**
 * Finds the parent object and name of a given function or value in the global scope.
 *
 * @param fn - The function or value to find in the global scope
 * @returns An object containing the name and parent object of the function, or `undefined` if not found
 *
 * @remarks
 * The `getParentObject` function attempts to locate where a function or value is defined
 * within the global context (`globalThis`). It searches for the function's name in the
 * global scope and also within properties of global objects. This is useful for
 * determining the original location of a function or value in the global namespace.
 *
 * Responsibilities:
 * - Finding functions directly attached to `globalThis`
 * - Locating functions within objects in the global scope
 * - Identifying functions by reference equality with global properties
 * - Supporting both named and anonymous functions
 *
 * @example
 * ```ts
 * // Finding a global function
 * const result = getParentObject(setTimeout);
 * // Returns: { name: 'setTimeout', parent: globalThis }
 *
 * // Finding a method on a global object
 * const arrayResult = getParentObject(Array.prototype.map);
 * // Returns: { name: 'map', parent: Array.prototype }
 * ```
 *
 * @since 1.2.0
 */

export function getParentObject(fn: unknown): { name: string, object: Record<string, unknown> } | undefined {
    if (fn == null) return undefined;
    const name = typeof fn === 'function' ? fn.name : undefined;

    if (name && name in globalThis) {
        return { name, object: globalThis };
    }

    for (const [ key, val ] of Object.entries(globalThis) as Array<[string, unknown]>) {
        if (val && name && (typeof val === 'object' || typeof val === 'function') && name in val) {
            return { name, object: val as Record<string, unknown> };
        }

        if (Object.is(fn, val)) {
            return { name: key, object: globalThis };
        }
    }

    return undefined;
}

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

    MockState.mocks.push(mockInstance);
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
 * @template Context - The context type that the mocked function binds to.
 * @template Args - The argument type of the mocked function. Defaults to an array of unknown values.
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
 * - Providing type-safe mock interfaces via {@link FnMockInterface}
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
 * @see FnMockInterface
 * @see FunctionLikeType
 *
 * @since 1.2.0
 */

export function fnImplementation<ReturnType, Args extends Array<unknown>, Context>(
    implementation?: FunctionLikeType<ReturnType, Args, Context>,
    restore?: () => FunctionLikeType<ReturnType, Args, Context> | void
): FnMockInterface<ReturnType, Args, Context> {
    return new MockState(implementation, restore, 'xJet.fn()') as FnMockInterface<ReturnType, Args, Context>;
}

/**
 * Creates a mock function with an optional custom implementation.
 *
 * @template Method - The return type of the function being mocked
 * @template Args - The argument types for the function, defaulting to unknown array
 * @template Context - The context type (`this`) for the function, defaulting to unknown
 *
 * @param method - The original function to mock
 * @param implementation - Optional custom implementation to use instead of the original
 * @returns A {@link MockState} instance that wraps the original function
 *
 * @remarks
 * The `mockImplementation` function creates a new {@link MockState} instance that wraps
 * around a provided function, allowing you to monitor calls to that function and optionally
 * override its implementation. This is particularly useful for testing components that
 * depend on external functions by providing controlled behavior during tests.
 *
 * Responsibilities:
 * - Creating a trackable mock function from any original function
 * - Supporting custom implementation override capability
 * - Preserving the original function's signature and return type
 * - Enabling all mock functionality like call tracking and verification
 * - Maintaining type safety between the original and mocked functions
 *
 * @example
 * ```ts
 * // Mock a function with default implementation
 * const fetchData = async () => ({ id: 1, name: 'Test' });
 * const mockedFetch = xJet.mock(fetchData);
 *
 * // Mock with custom implementation
 * const mockedFetchCustom = xJet.mock(fetchData, async () => {
 *   return { id: 2, name: 'Custom Test' };
 * });
 *
 * test('uses mocked function', async () => {
 *   const result = await mockedFetchCustom();
 *   expect(result.name).toBe('Custom Test');
 *   expect(mockedFetchCustom).toHaveBeenCalled();
 * });
 * ```
 *
 * @see MockState
 * @see FunctionLikeType
 * @see ConstructorLikeType
 *
 * @since 1.2.0
 */

export function mockImplementation<Method, Args extends Array<unknown> = [], Context = unknown>(
    method: FunctionLikeType<Method, Args, Context> | ConstructorLikeType<Method, Args>,
    implementation?: FunctionLikeType<Method, Args, Context>
): MockState<Method, Args, Context>;

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
    implementation?: FunctionLikeType<Element>
): MockState<Element>;


/**
 * Creates a mock for an item with an optional custom implementation.
 *
 * @param item - The item to mock
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

export function mockImplementation(item: unknown, implementation?: FunctionLikeType): unknown {
    if (typeof item === 'function' && (item as MockState).xJetMock)
        return item;

    const parentObject = getParentObject(item);
    if (!parentObject) {
        throw new ExecutionError('xJet.mock item is not part of any global object');
    }

    const { name, object } = parentObject;
    const originalMethod = Reflect.get(object, name);

    if (typeof item === 'function' && item.prototype && !Object.getOwnPropertyDescriptor(item, 'prototype')?.writable) {
        const mock = new MockState(
            (...args: Array<unknown>) => new (item as ConstructorLikeType<unknown, Array<unknown>>)(...args),
            () => {
                Reflect.set(object, name, originalMethod);
            }
        );

        Reflect.set(object, name, mock);
        MockState.mocks.push(mock);
        if(implementation) mock.mockImplementation(implementation);

        return object[name];
    }

    if (typeof item === 'function') {
        const mock = new MockState(<FunctionLikeType> item, () => {
            Reflect.set(object, name, originalMethod);
        });

        Reflect.set(object, name, mock);
        MockState.mocks.push(mock);
        if(implementation) mock.mockImplementation(implementation);

        return object[name];
    }

    const mock = mockDescriptorProperty(object, name);
    if(implementation) mock.mockImplementation(implementation);

    return mock;
}
