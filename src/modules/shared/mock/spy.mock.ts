/**
 * Import will remove at compile time
 */

import type { PartialResolvedType } from '@shared/mock/interfaces/fn-mock.interface';
import type { ConstructorLikeType, FunctionLikeType, FunctionType } from '@remotex-labs/xjet-expect';
import type { MockProxyInterface, MockProxyStateInterface } from '@shared/mock/interfaces/spy-mock.interface';

/**
 * Imports
 */

import { MockState } from '@shared/states/mock.state';
import { mockDescriptorProperty } from '@shared/mock/fn.mock';
import { ExecutionError } from '@shared/errors/execution.error';
import { deepSearchObject, getOwnProperty } from '@shared/components/object.component';

/**
 * Checks if a property on an object is provided via a proxy mechanism rather than directly defined.
 *
 * @template T - The type of object being checked
 *
 * @param obj - The object to inspect
 * @param key - The property key to check on the object
 * @returns `true` if the property is provided by a proxy, `false` if directly defined
 *
 * @remarks
 * This function determines whether a property on an object is being provided through
 * a proxy mechanism (like a Proxy object or getter) rather than being directly defined
 * on the object itself. It works by checking if the key doesn't exist in the object's
 * own properties while still returning a non-undefined value when accessed.
 *
 * This is useful for:
 * - Detecting dynamically created properties
 * - Identifying properties provided via getters or proxies
 * - Distinguishing between direct properties and inherited/proxied ones
 *
 * @example
 * ```ts
 * // Regular object with direct property
 * const directObj = { name: 'Test' };
 * console.log(isProxyProperty(directObj, 'name')); // false
 *
 * // Object with proxy property
 * const handler = {
 *   get(target, prop) {
 *     if (prop === 'dynamic') return 'This is dynamic';
 *     return target[prop];
 *   }
 * };
 * const proxyObj = new Proxy({}, handler);
 * console.log(isProxyProperty(proxyObj, 'dynamic')); // true
 * ```
 *
 * @since 1.2.0
 */

export function isProxyProperty<T extends object>(obj: T, key: keyof T): boolean {
    return !(key in obj) && Reflect.get(obj, key) !== undefined;
}

/**
 * Determines if a value is a mock proxy created by the mocking system.
 *
 * @param value - The value to check
 * @returns `true` if the value is a mock proxy, `false` otherwise
 *
 * @remarks
 * This function checks if an object has the internal `__isMockProxy__` symbol property
 * which is added to all mock proxy objects created by the mocking framework.
 *
 * Mock proxies are specialized proxy objects that intercept property access
 * and method calls while providing mocking capabilities.
 *
 * @example
 * ```ts
 * const regularObject = { name: 'Test' };
 * const mockObject = createMock({ name: 'Test' });
 *
 * isMockProxy(regularObject); // false
 * isMockProxy(mockObject);    // true
 * ```
 *
 * @since 1.2.2
 */

export function isMockProxy(value: Record<symbol, unknown>): boolean {
    return (value && typeof value === 'object' && '__isMockProxy__' in value);
}

/**
 * Creates a mock proxy that intercepts property access on an object.
 *
 * @template T - The type of the target object being proxied
 * @param target - The object to be proxied
 * @returns A MockProxyInterface that intercepts property access on the target
 *
 * @remarks
 * This function creates a proxy around an object that allows for interception
 * and customization of property access. The proxy maintains an internal state
 * that tracks mocked properties and provides mechanisms for customizing getter behavior.
 *
 * The proxy implements special properties:
 * - `__isMockProxy__`: Used to identify mock proxy objects
 * - `__MockMap__`: Provides access to the internal state for managing mocks
 *
 * Property access behavior:
 * 1. First checks if a custom getter is defined and uses it if available
 * 2. Then checks if the property has a specific mock implementation
 * 3. Falls back to the original property on the target object
 *
 * @example
 * ```ts
 * const user = { name: 'John', getAge: () => 30 };
 * const mockUser = createMockProxy(user);
 *
 * // Access original property
 * console.log(mockUser.name); // "John"
 *
 * // Add a mock for a property
 * const mockMap = mockUser.__MockMap__;
 * mockMap.mocks.set('getAge', () => 25);
 *
 * // Now returns the mock implementation
 * console.log(mockUser.getAge()); // 25
 * ```
 *
 * @since 1.2.2
 */

export function createMockProxy<T extends object>(target: T): MockProxyInterface {
    const state: MockProxyStateInterface = {
        mocks: new Map(),
        customGetter: null
    };

    const handler: ProxyHandler<T> = {
        get(_target, prop, receiver) {
            if (prop === '__isMockProxy__') return true;
            if (prop === '__MockMap__') return state;

            if (state.customGetter) {
                return state.customGetter(target, prop, receiver);
            }

            if (state.mocks.has(prop)) {
                return state.mocks.get(prop);
            }

            return Reflect.get(target, prop, receiver);
        }
    };

    return new Proxy({}, handler);
}

/**
 * Creates a spy on a property access for a proxied object.
 *
 * @template T - The type of the target object
 * @template K - The key of the property to spy on
 *
 * @param target - The proxy object containing the property to spy on
 * @param prop - The name of the property to spy on
 * @returns A MockState object wrapping the property access
 *
 * @remarks
 * This specialized spy function is designed to work with properties accessed through proxy objects.
 * It handles the complexities of intercepting property access in proxied objects by:
 *
 * 1. Locating the proxy object in the global scope if needed
 * 2. Converting a normal object to a mock proxy if it isn't already one
 * 3. Setting up a spy on the property get operation
 *
 * The function ensures proper cleanup by providing a cleanup function that removes
 * the spy from the proxy's internal mock map when the spy is restored.
 *
 * @throws Error - When the target object cannot be found in the global scope
 *
 * @example
 * ```ts
 * // With an existing proxy
 * const proxyObj = createMockProxy({ getData: () => 'data' });
 * const spy = spyOnProxyGet(proxyObj, 'getData');
 *
 * proxyObj.getData(); // Spy records this call
 * spy.verify.called(); // Passes
 *
 * // With a normal object (will be converted to proxy)
 * const obj = { getValue: () => 42 };
 * const valueSpy = spyOnProxyGet(obj, 'getValue');
 *
 * obj.getValue(); // Spy records this call
 * valueSpy.verify.called(); // Passes
 * ```
 *
 * @since 1.2.2
 */

export function spyOnProxyGet<T extends Record<string | symbol, unknown>, K extends keyof T>(target: T, prop: K): MockState {
    const found = deepSearchObject(globalThis, target);
    if (!found) {
        throw new Error('xJet.spyOn item is not part of any global object');
    }

    if (!isMockProxy(target)) {
        const { parent, key } = getOwnProperty(found.parent, found.key);
        const method = Reflect.get(parent, key);

        Reflect.set(parent, key, createMockProxy(method as object));
        target = Reflect.get(parent, key) as T;
    }

    const proxy = target as MockProxyInterface;
    const mockState = new MockState(<FunctionType> target[prop], () => {
        proxy.__MockMap__?.mocks.delete(prop);
    }, 'xJet.spyOn(Proxy#get)');

    proxy.__MockMap__?.mocks.set(prop, mockState);

    return mockState;
}

/**
 * Creates a spy on a method or property of an object.
 *
 * @template T - The type of the target object
 * @template K - The key of the property or method to spy on
 *
 * @param target - The object containing the method or property to spy on
 * @param key - The name of the method or property to spy on
 * @returns A MockState object wrapping the original method or property
 *
 * @remarks
 * This function creates a spy that wraps around an existing method or property on an object.
 * The spy tracks all calls to the method or access to the property while still executing the original functionality.
 *
 * - For methods: The spy preserves the original `this` context and passes all arguments to the original method
 * - For properties: The spy intercepts property access and returns the original value
 *
 * @example
 * ```ts
 * // Spying on a method
 * const user = {
 *   getName: (prefix: string) => prefix + ' John'
 * };
 * const spy = xJet.spyOn(user, 'getName');
 *
 * user.getName('Mr.'); // Returns "Mr. John"
 * ```
 *
 * @since 1.0.0
 */

export function spyOnImplementation<T extends object, K extends keyof T>(target: T, key: K):
    T[K] extends FunctionType ?
        MockState<(
            this: ThisParameterType<T[K]>, ...args: Parameters<T[K]>
        ) => PartialResolvedType<ReturnType<T[K]>>>
        : MockState<() => T[K]>;

/**
 * Creates a spy on a method or property of an object.
 *
 * @template T - The type of the target object
 * @template K - The key of the property or method to spy on
 *
 * @param target - The object containing the method or property to spy on
 * @param prop - The name of the method or property to spy on
 * @returns A MockState object wrapping the original method or property
 *
 * @remarks
 * This function creates a spy that wraps around an existing method or property on an object.
 * The spy tracks all calls to the method or access to the property while still executing the original functionality.
 *
 * - For methods: The spy preserves the original behavior while monitoring calls
 * - For properties: The spy intercepts property access via descriptor methods
 * - For class constructors: Special handling ensures proper constructor behavior
 *
 * The implementation handles various edge cases:
 * - Properties accessed through proxies
 * - Constructor functions with non-writable prototypes
 * - Properties that may exist in the prototype chain
 *
 * @throws ExecutionError - When:
 * - Target is not an object or function
 * - Property key is null
 * - Property doesn't exist on the target or its prototype chain
 *
 * @example
 * ```ts
 * // Spying on a method
 * const user = {
 *   getName: () => { return 'John'; }
 * };
 * const spy = xJet.spyOn(user, 'getName');
 *
 * user.getName(); // Returns "John"
 * ```
 *
 * @since 1.0.0
 */

export function spyOnImplementation<T extends Record<string | symbol, unknown>, K extends keyof T>(target: T, prop: K): MockState {
    if (target == null || (typeof target !== 'object' && typeof target !== 'function'))
        throw new ExecutionError('Target must be an object or function');

    if (prop === null)
        throw new ExecutionError('Spied property/method key is required');

    if (isProxyProperty(target, prop))
        return spyOnProxyGet(target, <string> prop);

    const { parent, key } = getOwnProperty(target, <string> prop);
    if (!(key in parent))
        throw new ExecutionError(`Property/method '${ String(key) }' does not exist on target`);

    const method = <MockState | T[K]> Reflect.get(parent, key);
    if (!method) throw new Error(`Property '${ String(key) }' does not exist in the provided object`);
    if ((<MockState> method).xJetMock) return <MockState> method;

    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (typeof method !== 'function' || descriptor?.get)
        return mockDescriptorProperty(target, key);

    let fn: FunctionLikeType = method as FunctionLikeType;
    const protoDesc = Object.getOwnPropertyDescriptor(fn, 'prototype');
    if (fn.prototype && protoDesc && !protoDesc.writable) {
        fn = (...args: unknown[]): unknown =>
            new (method as ConstructorLikeType<unknown, unknown[]>)(...args);
    }

    const mockState = new MockState(fn, () => {
        Reflect.set(target, key, method);
    }, 'xJet.spyOn()');

    MockState.mocks.add(new WeakRef(mockState));
    Reflect.set(target, key, mockState);

    return mockState;
}
