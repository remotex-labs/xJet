/**
 * Import will remove at compile time
 */

import type { ConstructorLikeType } from '@remotex-labs/xjet-expect';

/**
 * Imports
 */

import '@shared/components/polyfill.component';
import { MockState } from '@shared/states/mock.state';

/**
 * Tests
 */

describe('MockState Class', () => {
    test('should create an instance with default properties', () => {
        const mockState = new MockState();

        expect(mockState.name).toBe('xJet.mock()'); // Default name
        expect(mockState.mock.calls).toEqual([]);
        expect(mockState.mock.results).toEqual([]);
    });

    test('should clear mock data when mockClear is called', () => {
        const mockState = new MockState();
        mockState.mock.calls.push(<any> [ 'arg1' ]);
        mockState.mock.results.push({ value: 'result1', type: 'return' });

        mockState.mockClear();

        expect(mockState.mock.calls).toEqual([]);
        expect(mockState.mock.results).toEqual([]);
    });

    test('should reset mock data and queued implementations when mockReset is called', () => {
        const mockState = new MockState();
        mockState.mock.calls.push(<any> [ 'arg1' ]);
        mockState.mock.results.push({ value: 'result1', type: 'return' });
        mockState.mockImplementationOnce(() => 'new result');

        mockState.mockReset();

        expect(mockState.mock.calls).toEqual([]);
        expect(mockState.mock.results).toEqual([]);
        expect(mockState.getNextImplementation()).toBeUndefined();
    });

    test('should restore mock to initial implementation and reset state when mockRestore is called', () => {
        const initialImplementation = jest.fn().mockReturnValue('initial result');
        const mockState = new MockState(initialImplementation);

        mockState.mockImplementation(() => 'new result');
        expect(mockState.getMockImplementation()?.()).toBe('new result');

        mockState.mockRestore();

        expect(mockState.getMockImplementation()?.()).toBe('initial result');
        expect(mockState.mock.calls).toEqual([]);
    });

    test('should set a custom implementation using mockImplementation', () => {
        const mockState = new MockState();
        mockState.mockImplementation(() => 'custom result');

        const result = mockState();

        expect(result).toBe('custom result');
    });

    test('should queue a one-time implementation using mockImplementationOnce', () => {
        const mockState = new MockState();
        mockState.mockImplementationOnce(() => 'first call');
        mockState.mockImplementationOnce(() => 'second call');

        const firstResult = mockState();
        const secondResult = mockState();
        const thirdResult = mockState();

        expect(firstResult).toBe('first call');
        expect(secondResult).toBe('second call');
        expect(thirdResult).toBeUndefined(); // No default implementation provided
    });

    test('should implementation result return throw error', () => {
        const mockState = new MockState(() => {
            throw new Error('Test error');
        });

        expect(mockState()).toEqual(new Error('Test error'));
        expect(mockState.mock.results[0]).toEqual({ type: 'throw', value: new Error('Test error') });
    });

    test('should implementation result return undefined', () => {
        const mockState = new MockState();

        expect(mockState()).toBeUndefined();
        expect(mockState.mock.results[0]).toEqual({ type: 'return', value: undefined });
    });

    test('should set a fixed return value using mockReturnValue', () => {
        const mockState = new MockState();
        mockState.mockReturnValue('fixed value');

        const result1 = mockState();
        const result2 = mockState();

        expect(result1).toBe('fixed value');
        expect(result2).toBe('fixed value');
    });

    test('should queue a one-time return value using mockReturnValueOnce', () => {
        const mockState = new MockState();
        mockState.mockReturnValueOnce('once value');

        const result1 = mockState();
        const result2 = mockState();

        expect(result1).toBe('once value');
        expect(result2).toBeUndefined(); // No default return value
    });

    test('should set a resolved value using mockResolvedValue', async () => {
        const mockState = new MockState<() => Promise<string>>();
        mockState.mockResolvedValue('resolved value');

        await expect(mockState()).resolves.toBe('resolved value');
    });

    test('should queue a one-time resolved value using mockResolvedValueOnce', async () => {
        const mockState = new MockState<() => Promise<string>>();
        mockState.mockResolvedValueOnce('first resolve');
        mockState.mockResolvedValueOnce('second resolve');

        await expect(mockState()).resolves.toBe('first resolve');
        await expect(mockState()).resolves.toBe('second resolve');
        await expect(mockState()).toBeUndefined(); // No default promise value
    });

    test('should set a rejected value using mockRejectedValue', async () => {
        const mockState = new MockState<() => Promise<string>>();
        mockState.mockRejectedValue('rejected value');

        await expect(mockState()).rejects.toBe('rejected value');
    });

    test('should queue a one-time rejected value using mockRejectedValueOnce', async () => {
        const mockState = new MockState<() => Promise<string>>();
        mockState.mockRejectedValueOnce('first reject');
        mockState.mockRejectedValueOnce('second reject');

        await expect(mockState()).rejects.toBe('first reject');
        await expect(mockState()).rejects.toBe('second reject');
        await expect(mockState()).toBeUndefined(); // No default promise rejection
    });

    test('should track calls and their order', () => {
        const mockState = new MockState<(arg1: string, arg2: number) => string>();
        mockState('arg1', 1);
        mockState('arg2', 2);

        expect(mockState.mock.calls).toEqual([
            [ 'arg1', 1 ],
            [ 'arg2', 2 ]
        ]);
        expect(mockState.mock.invocationCallOrder).toEqual([ 1, 2 ]);
    });

    test('should log the correct inspect message', () => {
        const mockState = <any> new MockState(undefined, undefined, 'TestMock');
        const inspectMessage = mockState[Symbol.for('nodejs.util.inspect.custom')]();

        expect(inspectMessage).toBe('<Mock Constructor TestMock>');
    });

    test('should correctly invoke a class constructor and return the instance', () => {
        const mockState = <any> new MockState(() => ({ property: 'value' }));
        const result = new mockState('arg1', 'arg2');

        // Validate the result
        expect(result).toEqual({ property: 'value' }); // The method should return the mocked class instance
        expect(mockState.mock.instances).toContain(result); // Verify the created class instance is tracked
        expect(mockState.mock.calls).toEqual([[ 'arg1', 'arg2' ]]); // Arguments should be stored and tracked
    });

    test('should return the `newTarget` if no implementation is provided or the result is not an object', () => {
        const mockState = <ConstructorLikeType & MockState> new MockState(undefined, undefined, 'TestMock');
        const result = new mockState();

        // Validate the result
        expect(result).toBeInstanceOf(MockState);
        expect(mockState.mock.instances).toContain(mockState); // Ensure the newTarget is stored in state
    });

    test('should properly track arguments and invocation order', () => {
        const mockState = <ConstructorLikeType<any, any> & MockState> <unknown> new MockState(() => {});
        new mockState('arg1', 'arg2');

        expect(mockState.mock.calls).toEqual([[ 'arg1', 'arg2' ]]); // Arguments are tracked
        expect(mockState.mock.invocationCallOrder).toEqual([ 1 ]);  // Invocation order is updated
    });

    test('should correctly handle implementations that return primitive values', () => {
        class TestClass {
            test() {
                return 42;
            }
        }

        const mockState = <ConstructorLikeType<any, any> & MockState> <unknown> new MockState(() => new TestClass());
        const result = <TestClass> new mockState('arg1');

        expect(result.test()).toBe(42);
        expect(result).toBeInstanceOf(TestClass);
        expect(mockState.mock.contexts).toContain(mockState);
        expect(mockState.mock.instances[0]).toBeInstanceOf(TestClass);
    });

    test('should handle errors thrown by the implementation and track them in mock results', () => {
        const errorInstance = new Error('Mock error');
        const mockState = <ConstructorLikeType & MockState> <unknown> (new MockState(() => {
            throw errorInstance;
        }));

        expect(new mockState()).toBe(errorInstance);
        expect(mockState.mock.results[0]).toEqual({ type: 'throw', value: errorInstance });
    });

    test('should prepend bound arguments to the arguments list', () => {
        const mockImplementation = function (...args: unknown[]) {
            return args;
        };

        const mockState = new MockState(mockImplementation.bind({ name: 'test' }, 'boundArg1', 'boundArg2'));
        mockState('arg1', 'arg2');

        expect(mockState.mock.contexts[0]).toEqual({ name: 'test' });
        expect(mockState.mock.calls[0]).toEqual([ 'boundArg1', 'boundArg2', 'arg1', 'arg2' ]);
    });

    test('should set the bound context (this) when invoking the implementation', () => {
        const mockImplementation = () => {
            return 42;
        };

        const mockState = new MockState(mockImplementation.bind({ contextValue: 'boundContext' }));
        mockState();

        expect(mockState.mock.instances.length).toEqual(1);
        expect(mockState.mock.instances[0]).toBeUndefined();
        expect(mockState.mock.contexts[0]).toEqual({ contextValue: 'boundContext' }); // Verify that the mock tracks the bound context
    });
});
