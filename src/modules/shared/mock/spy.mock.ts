/**
 * Import will remove at compile time
 */

import type { ConstructorLikeType, FunctionLikeType, FunctionType } from '@remotex-labs/xjet-expect';
import type { ConstructorKeysType, KeysExtendingConstructorType } from '@shared/mock/interfaces/spy-mock.interface';

/**
 * Imports
 */

import { MockState } from '@shared/states/mock.state';
import { ExecutionError } from '@shared/errors/execution.error';
import { getParentObject, mockDescriptorProperty } from '@shared/mock/fn.mock';

export const proxyRegistry = new WeakMap<object, {
    proxy: unknown;
    spies: Map<PropertyKey, MockState>;
}>();

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
 * Creates a spy on a property accessed via a proxy getter, allowing interception
 * and monitoring of property access operations.
 *
 * @template T - The type of the target object containing the proxy
 * @template K - The type of property key being spied on
 *
 * @param target - The object containing the property to spy on
 * @param key - The property key to intercept access to
 * @param method - The method to execute when the property is accessed
 * @returns A {@link MockState} instance that tracks interactions with the property
 *
 * @throws Error - If the target is not part of any global object
 *
 * @example
 * ```ts
 * // Create an object with dynamic property access
 * const user = new Proxy({}, {
 *   get(target, prop) {
 *     if (prop === 'name') return 'John';
 *     return target[prop];
 *   }
 * });
 *
 * // Spy on the 'name' property
 * const nameSpy = spyOnProxyGet(user, 'name', () => 'Jane');
 *
 * // Now accessing user.name returns 'Jane' and the access is tracked
 * console.log(user.name); // 'Jane'
 * expect(nameSpy).toHaveBeenCalled();
 *
 * // Restore original behavior
 * nameSpy.mockRestore();
 * console.log(user.name); // 'John'
 * ```
 *
 * @see MockState
 * @see getParentObject
 *
 * @since 1.2.0
 */

export function spyOnProxyGet<T extends object, K extends keyof T>(target: T, key: K, method: unknown): MockState {
    const parent = getParentObject(target);
    if (!parent) {
        throw new Error('xJet.spyOn item is not part of any global object');
    }

    let entry = proxyRegistry.get(target);
    if (!entry) {
        entry = {
            proxy: null,
            spies: new Map<PropertyKey, MockState>()
        };

        entry.proxy = new Proxy(target, {
            get(orig, prop, receiver): unknown {
                if (entry!.spies.has(prop)) {
                    return entry!.spies.get(prop)!();
                }

                return Reflect.get(orig, prop, receiver);
            }
        });

        proxyRegistry.set(target, entry);
        Reflect.set(parent.object, parent.name, entry.proxy);
    }

    const fn = method as FunctionLikeType;
    const mockState = new MockState(fn, () => {
        entry!.spies.delete(key);
        Reflect.set(parent.object, parent.name, target);
    }, 'xJet.spyOn(Proxy#get)');

    MockState.mocks.push(mockState);
    entry.spies.set(key, mockState);

    return mockState;
}

/**
 * Creates a spy on a specified static method or static property of a target class (not a class instance).
 * Useful for mocking behavior during testing.
 *
 * @template Target - The type of the target class.
 * @template Key - The static method or static property key on the target object to spy on.
 *
 * @param target - The object on which to spy.
 * @param key - The key of the method or property of the target to spy on.
 * @returns If the spied-on property is a function, returns a `MockState` object for the function,
 * allowing tracking of calls and modifying the return value or behavior.
 * Otherwise, returns a `MockState` object for the property, enabling tracking and manipulation of its value.
 *
 * @throws Error Throws an error if the `target` is a primitive value.
 * @throws Error Throws an error if `key` is null or undefined.
 * @throws Error Throws an error if the specified property does not exist on the target object.
 *
 * @remarks
 * This function is commonly used in testing environments to replace or monitor functionality without
 * altering the actual logic in the source code. It provides fine-grained control over target behavior.
 *
 * @example
 * ```ts
 * class ClassTest {
 *     static name: string = 'ClassTest';
 *
 *     static x(param: string) {
 *         console.log(`original static x ${ param }`);
 *     }
 * }
 *
 * const spy1 = xJet.spyOn(ClassTest, 'name');
 * const spy2 = xJet.spyOn(ClassTest, 'x');
 *
 * spy1.mockReturnValueOnce('Mock name');
 * spy2.mockImplementationOnce((param: string) => {
 *     console.log(`Mock x ${ param }`);
 * });
 *
 * console.log(ClassTest.name); // Mock name
 * console.log(ClassTest.name); // ClassTest
 *
 * ClassTest.x('test1'); // Mock x test1
 * ClassTest.x('test2'); // original static x test2
 * ```
 *
 * @see FunctionType
 * @see KeysExtendingConstructorType
 *
 * @since 1.0.0
 */

export function spyOnImplementation<Target, Key extends KeysExtendingConstructorType<Target>>(target: Target, key: Key): Target[Key] extends FunctionType
    ? MockState<ReturnType<Target[Key]>, Parameters<Target[Key]>, Target>
    : MockState<Target[Key], [], Target>;

/**
 * Creates a mock spy on the specified method or constructor of the target object.
 *
 * @template Target The type of the target object.
 * @template Key The type of the method or constructor key on the target object.
 *
 * @param target - The object whose method or constructor needs to be spied on.
 * @param key - The property key of the method or constructor to spy on.
 * @return A mock state representing the spied method or constructor if the key corresponds to a constructor type;
 * otherwise, throws a type error.
 *
 * @throws Error Throws an error if the `target` is a primitive value.
 * @throws Error Throws an error if `key` is null or undefined.
 * @throws Error Throws an error if the specified property does not exist on the target object.
 *
 * @remarks
 * This method is typically used for testing purposes to observe or manipulate calls to the method or constructor of an object.
 * The returned mock state may allow additional configuration, such as altering its behavior or tracking calls.
 *
 * @example
 * ```ts
 * const coolObject = {
 *     ClassTest: class {
 *         constructor(param: number) {
 *             console.log('original Constructor');
 *         }
 *
 *         justAnFunction() {
 *             console.log('original justAnFunction');
 *         }
 *     }
 * };
 *
 * const spy = xJet.spyOn(coolObject, 'ClassTest');
 * spy.mockImplementationOnce((param: number) => {
 *     console.log(`mock Constructor with param: ${ param }`);
 *
 *     return <any> {
 *         justAnFunction() {
 *             console.log('mock justAnFunction');
 *         }
 *     };
 * });
 *
 * const instance = new coolObject.ClassTest(1); // mock Constructor with param: 1
 * instance.justAnFunction(); // mock justAnFunction
 *
 * const instance2 = new coolObject.ClassTest(2); // original Constructor
 * instance2.justAnFunction(); // original justAnFunction
 * ```
 *
 * @see ConstructorType
 * @see ConstructorKeysType
 *
 * @since 1.0.0
 */

export function spyOnImplementation<Target, Key extends ConstructorKeysType<Target>>(target: Target, key: Key): Target[Key] extends ConstructorLikeType
    ? MockState<InstanceType<Target[Key]>, ConstructorParameters<Target[Key]>, Target>
    : never;

/**
 * Creates a spy on a specific method or property of the given target object.
 *
 * @template Target - The type of the target object to spy on.
 * @template Key - The key of the property or method to spy on within the target object.
 *
 * @param target - The target object containing the property or method to be spied upon.
 * @param key - The name of the property or method on the target object to spy on.
 * @returns If the spied target is a function, it returns a `MockState` object to observe calls and arguments of the function.
 *          Otherwise, it returns a `MockState` object to observe the value or state of the property.
 *
 * @throws Error Throws an error if the `target` is a primitive value.
 * @throws Error Throws an error if `key` is null or undefined.
 * @throws Error Throws an error if the specified property does not exist on the target object.
 *
 * @remarks This method is commonly used in test environments to monitor and assert interactions with a specific property
 *          or method on an object. The returned `MockState` can be used to retrieve call history or observe mutations.
 *
 * @example
 * ```ts
 * const coolObject = {
 *     myMethod() {
 *         return 'Original myMethod';
 *     },
 *     coolString: 'Original coolString'
 * };
 *
 * const spy = xJet.spyOn(coolObject, 'coolString');
 * const spy2 = xJet.spyOn(coolObject, 'myMethod');
 *
 * spy.mockImplementationOnce(() => 'mock coolString');
 * spy2.mockImplementationOnce(() => 'mock myMethod string');
 *
 * console.log(coolObject.coolString); // mock coolString
 * console.log(coolObject.coolString); // Original coolString
 * console.log(coolObject.myMethod()); // mock myMethod string
 * console.log(coolObject.myMethod()); // Original myMethod
 * ```
 *
 * @see FunctionType
 *
 * @since 1.0.0
 */

export function spyOnImplementation<Target, Key extends keyof Target>(target: Target, key: Key): Target[Key] extends FunctionType
    ? MockState<ReturnType<Target[Key]>, Parameters<Target[Key]>, ThisParameterType<Target[Key]>>
    : MockState<Target[Key] | void, [ Target[Key] ], ThisParameterType<Target[Key]>>

/**
 * Creates a spy on the specified method or property of the given target object.
 *
 * Replaces the specified method or property with a mock implementation that can be tracked during testing.
 *
 * @template T - The type of the target object.
 * @template K - The keyof the target used to specify the method or property being spied upon.
 *
 * @param target - The object that contains the method or property to spy on. Must be a non-primitive object or function.
 * @param key - The name of the property or method to spy on.
 *
 * @return MockState A `MockState` instance representing the state of the spied-on property or method, allowing tracking and mocking.
 *
 * @throws Error If the target is null, undefined, or a primitive value such as a string or number.
 * @throws Error If the `key` parameter is null or undefined.
 * @throws Error If the specified property does not exist in the target object.
 *
 * @remarks
 * This function is part of a testing framework and is used to track interactions with an object's method or property.
 * It can modify non-function properties or replace function properties with a mock function for testing purposes.
 * The original method or property can be restored after the spy lifecycle is completed.
 *
 * This method will throw errors for invalid inputs, or if the target object does not have the specified property.
 *
 * @since 1.0.0
 */

export function spyOnImplementation<T extends object, K extends keyof T>(target: T, key: K): MockState {
    if (target == null || (typeof target !== 'object' && typeof target !== 'function'))
        throw new ExecutionError('Target must be an object or function');

    if (key === null)
        throw new ExecutionError('Spied property/method key is required');

    if (isProxyProperty(target, key))
        return spyOnProxyGet(target, key, Reflect.get(target, key));

    if (!(key in target))
        throw new ExecutionError(`Property/method '${ String(key) }' does not exist on target`);

    const method = <MockState | T[K]> Reflect.get(target, key);
    if (!method) throw new Error(`Property '${ String(key) }' does not exist in the provided object`);
    if ((<MockState> method).xJetMock)  return <MockState> method;

    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (typeof method !== 'function' || descriptor?.get) return mockDescriptorProperty(target, key);

    let fn: FunctionLikeType = method as FunctionLikeType;
    const protoDesc = Object.getOwnPropertyDescriptor(fn, 'prototype');
    if (fn.prototype && protoDesc && !protoDesc.writable) {
        fn = (...args: unknown[]): unknown => new (method as ConstructorLikeType<unknown, unknown[]>)(...args);
    }

    const mockState = new MockState(fn, () => {
        Reflect.set(target, key, method);
    }, 'xJet.spyOn()');

    MockState.mocks.push(mockState);
    Reflect.set(target, key, mockState);

    return mockState;
}
