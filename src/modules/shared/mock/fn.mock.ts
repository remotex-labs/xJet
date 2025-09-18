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
 * Retrieves the parent object of the specified function if it exists within the global context.
 *
 * @template FunctionLikeType - The type representing the input function.
 *
 * @param fn - The function whose parent object is to be retrieved.
 * @returns The parent object containing the function, or `undefined` if no such object is found.
 *
 * @remarks
 * This method searches for the parent object of a given function within the global context
 * by checking if the function name exists as a key of an object in the global scope.
 * If the function exists directly in the global scope, the global object itself is returned.
 *
 * @since 1.0.0
 */

export function getParentObject(fn: FunctionLikeType): Record<string, unknown> | undefined {
    if (fn.name in globalThis) return globalThis;

    const name = fn.name;
    const globalElements: typeof globalThis = globalThis;

    for (const key of Object.keys(globalThis) as unknown as (keyof typeof globalThis)[]) {
        const val = <Record<string, unknown>> globalElements[key];
        if(typeof val !== 'function' && typeof val !== 'object') continue;
        if (val && name in val) {
            return globalElements[key];
        }
    }

    return undefined;
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
 * This function creates a mock function handler, typically used in testing scenarios.
 * You can provide an implementation for the mock behavior or specify a restore
 * handler for resetting the mock's state.
 *
 * @example
 * ```ts
 * // Creating a mock with a custom implementation
 * const mock = xJet.fn((x: number) => x * 2);
 * console.log(mock(5)); // 10
 *
 * // Creating a mock with a restore function
 * const mockWithRestore = xJet.fnImplementation(undefined, () => { console.log('Restored!'); });
 * mockWithRestore.restore(); // "Restored!"
 * ```
 *
 * @see MockState
 *
 * @since 1.0.0
 */

export function fnImplementation<ReturnType, Args extends Array<unknown>, Context>(
    implementation?: FunctionLikeType<ReturnType, Args, Context>,
    restore?: FunctionLikeType<void>
): FnMockInterface<ReturnType, Args, Context> {
    const instance = new MockState(implementation, restore, 'xJet.fn()');

    return <FnMockInterface<ReturnType, Args, Context>> instance;
}

/**
 * Creates a mock instance for the given method or constructor.
 *
 * @template Method - The type of the method being mocked.
 * @template Context - The `this` context type of the method.
 * @template Args - The types of the arguments accepted by the method.
 *
 * @param method - The method or constructor to mock. This can either be a function-like type or a
 * constructor-like type.
 * @returns A `MockState` instance associated with the provided method, allowing for capturing
 * interactions and controlling behavior during testing.
 *
 * @remarks
 * This method identifies whether the provided method is a function or constructor and creates
 * a suitable mock state. If the method is already mocked, the existing mock state is returned.
 * Throws an error if the method does not belong to an object or if it has an invalid type.
 *
 * @example
 * ```ts
 * // Mocking a regular method
 * function greet(name: string) {
 *     return `Hello, ${ name }`;
 * }
 *
 * const greetMock = xJet.mock(greet);
 * greetMock.mockImplementation(() => 'Hi!');
 * console.log(greet('World')); // "Hi!"
 *
 * // Mocking a constructor
 * class Person {
 *     constructor(public name: string) {}
 * }
 * const personMock = xJet.mock(Person);
 * personMock.mockImplementation((name: string) => ({ name: `${name} (mocked)` }));
 * const person = new Person('Alice');
 * console.log(person.name); // "Alice (mocked)"
 *
 * // Restoring the original method
 * greetMock.mockRestore();
 * console.log(greet('World')); // "Hello, World"
 * ```
 *
 * @since 1.0.0
 */

export function mockImplementation<Method, Args extends Array<unknown>, Context>(
    method: FunctionLikeType<Method, Args, Context> | ConstructorLikeType<Method, Args>
): MockState<Method, Args, Context> {
    if ((method as unknown as MockState).xJetMock)
        return <MockState<Method, Args, Context>> <unknown> method;

    const parentObject = getParentObject(<FunctionLikeType> method);
    if (!parentObject) {
        throw new ExecutionError('Method is not part of an object');
    }

    const originalMethod = method;

    // Handle constructor-like methods
    // todo bind to class constructor
    if (method.prototype && !Object.getOwnPropertyDescriptor(method, 'prototype')?.writable) {
        const mock = new MockState<Method, Args, Context>(
            (...args: Args) => new (method as ConstructorLikeType<Method, Args>)(...args),
            () => {
                parentObject[method.name] = originalMethod;
            }
        );

        parentObject[method.name] = mock;
        MockState.mocks.push(<MockState> <unknown> mock);

        return parentObject[method.name] as MockState<Method, Args, Context>;
    }

    // Handle regular functions
    if (typeof method === 'function') {
        const mock = new MockState(<FunctionLikeType> method, () => {
            parentObject[method.name] = originalMethod;
        });

        parentObject[method.name] = mock;
        MockState.mocks.push(<MockState> <unknown> mock);

        return parentObject[method.name] as MockState<Method, Args, Context>;
    }

    throw new ExecutionError('Invalid method type');
}
