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

/**
 * Intercepts and mocks the property descriptor of a specified property on a target object.
 *
 * @template Target - The target object type.
 * @template Key - The key of the property to be mocked.
 *
 * @param target - The object whose property descriptor is being intercepted and mocked.
 * @param key - The property key on the target object to spy on.
 * @return A `MockState` instance that provides control over the mocked property and its interactions.
 *
 * @remarks
 * This function replaces the property's getter and setter to allow interception and testing of their behavior.
 * A `MockState` instance is returned to control and observes mocked behavior.
 *
 * @since 1.0.0
 */

export function spyOnDescriptorProperty<Target, Key extends keyof Target>(target: Target, key: Key): MockState<Target[Key], []> {
    const original = target[key];
    const originalDescriptor = Object.getOwnPropertyDescriptor(target, key) || {};
    const mockInstance = new MockState(() => original, () => {
        target[key] = originalDescriptor.value;
        Object.defineProperty(target, key, originalDescriptor);
    }, 'xJet.spyOn()');

    MockState.mocks.push(mockInstance);
    Object.defineProperty(target, key, {
        get() {
            return mockInstance.apply(this, []);
        },
        set(value: unknown) {
            mockInstance.mockImplementation(() => <Target[Key]> value);

            return mockInstance.apply(this, [ value ]);
        }
    });

    return mockInstance;
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
 * This method will throw errors for invalid inputs or if the target object does not have the specified property.
 *
 * @since 1.0.0
 */

export function spyOnImplementation<T extends object, K extends keyof T>(target: T, key: K): MockState {
    if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
        throw new ExecutionError(`Cannot use spyOn on a primitive value; ${ typeof target } given`);
    }

    if (key === null) {
        throw new ExecutionError('No property name supplied');
    }

    const item = <FunctionLikeType | ConstructorLikeType> target[key];
    if (!item) {
        throw new Error(`Property '${ String(key) }' does not exist in the provided object`);
    }

    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if(descriptor && typeof descriptor.get === 'function' && descriptor.configurable === false) {
        throw new Error(`Property '${ String(key) }' is not configurable in an getter object`);
    }

    if (typeof item !== 'function' || (descriptor && typeof descriptor.get === 'function')) {
        return spyOnDescriptorProperty(target, key);
    }

    if (!(<MockState> <unknown> item).isMock) {
        let itemFunction: FunctionLikeType = <FunctionLikeType> item;
        if (itemFunction.prototype && !Object.getOwnPropertyDescriptor(itemFunction, 'prototype')?.writable) {
            itemFunction = (...args: unknown[]): unknown => new (<ConstructorLikeType<unknown, unknown[]>> item)(...args);
        }

        target[key] = <T[K]> new MockState(itemFunction, () => {
            target[key] = <T[K]> item;
        }, 'xJet.spyOn()');
    }

    return <MockState> target[key];
}
