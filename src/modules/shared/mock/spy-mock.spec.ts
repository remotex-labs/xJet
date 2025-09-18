/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';

/**
 * Imports
 */

import { MockState } from '@shared/states/mock.state';
import { spyOnImplementation, spyOnDescriptorProperty } from '@shared/mock/spy.mock';

/**
 * Tests
 */

describe('spyOnDescriptorProperty', () => {
    let mockObject: { myProperty: string };

    beforeEach(() => {
        // Mock object with a property
        mockObject = { myProperty: 'original value' };
    });

    test('should mock the getter of the property', () => {
        const mockState = spyOnDescriptorProperty(mockObject, 'myProperty');

        // Ensure the getter returns the MockState value
        mockState.mockReturnValueOnce('mocked value');
        expect(mockObject.myProperty).toBe('mocked value');
        expect(mockObject.myProperty).toBe('original value');
    });

    test('should mock the setter of the property', () => {
        const mockState = spyOnDescriptorProperty(mockObject, 'myProperty');

        // Assign a new value to the property
        mockObject.myProperty = 'new value';

        expect(mockState.mock.lastCall).toEqual([ 'new value' ]);
    });

    test('should revert mocked property when cleaned up', () => {
        const originalDescriptor = Object.getOwnPropertyDescriptor(mockObject, 'myProperty');
        const mockState = spyOnDescriptorProperty(mockObject, 'myProperty');

        // Clean up
        mockState.mockRestore();

        // Validate the property descriptor is restored
        const restoredDescriptor = Object.getOwnPropertyDescriptor(mockObject, 'myProperty');
        expect(restoredDescriptor).toEqual(originalDescriptor);
    });
});

describe('spyOn - ConstructorLikeType Methods', () => {
    let targetObject: { MyClass: new (...args: unknown[]) => { args: unknown[] } };

    beforeEach(() => {
        // Target object containing a constructor-like method
        targetObject = {
            MyClass: class {
                args: unknown[];

                constructor(...args: unknown[]) {
                    this.args = args;
                }
            }
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should create a spy for a constructor-like method', () => {
        const mockState = spyOnImplementation(targetObject, 'MyClass');
        (<any> mockState)._isMockFunction = true;
        (<any> mockState).getMockName = () => mockState.name;

        // Call the method from the target object
        new targetObject.MyClass('arg1', 'arg2');

        // Assert the mock signature was created
        expect(mockState).toBeInstanceOf(MockState);
        expect(mockState).toHaveBeenCalledWith('arg1', 'arg2');

        // Validate interactions
        expect(mockState).toHaveBeenCalledTimes(1);
        expect(mockState.mock.instances.length).toBe(1);
        expect(mockState.mock.instances[0]).toEqual({ 'args': [ 'arg1', 'arg2' ] });
    });

    test('should allow mocking the constructor behavior using MockState', () => {
        const mockState = spyOnImplementation(targetObject, 'MyClass');
        (<any> mockState)._isMockFunction = true;
        (<any> mockState).getMockName = () => mockState.name;

        // Change mock implementation through MockState
        mockState.mockImplementation(() => (<any> {
            mockedKey: 'mockedValue'
        }));

        const instance = new targetObject.MyClass('test');

        // Validate the mocked behavior
        expect(instance).toEqual({ mockedKey: 'mockedValue' });
    });
});

describe('spyOn - FunctionLikeType Methods', () => {
    let targetObject: { myMethod: FunctionType };

    beforeEach(() => {
        // Setting up a target object with a callable method
        targetObject = {
            myMethod: function (arg1: string, arg2: number): string {
                return `Original: ${ arg1 }, ${ arg2 }`;
            }
        };
    });

    test('should spy on a method and track calls', () => {
        const mockState = spyOnImplementation(targetObject, 'myMethod');
        (<any> mockState)._isMockFunction = true;
        (<any> mockState).getMockName = () => mockState.name;

        // Call the method normally from the target object
        const result = targetObject.myMethod('test', 42);

        // Ensure that the original method is working
        expect(result).toBe('Original: test, 42');

        // Assert MockState instance was returned
        expect(mockState).toBeInstanceOf(MockState);

        // Assert the original method was called with correct arguments
        expect(mockState).toHaveBeenCalledWith('test', 42);
        expect(mockState).toHaveBeenCalledTimes(1);
    });

    test('should override the method’s behavior using MockState', () => {
        const mockState = spyOnImplementation(targetObject, 'myMethod');
        (<any> mockState)._isMockFunction = true;
        (<any> mockState).getMockName = () => mockState.name;

        // Use mockImplementation to replace the behavior
        mockState.mockImplementation((arg1: string, arg2: number) => `Mocked: ${ arg1 }, ${ arg2 }`);

        const overriddenResult = targetObject.myMethod('override', 101);

        // Validate the mocked behavior
        expect(overriddenResult).toBe('Mocked: override, 101');

        // Validate the call tracking still works
        expect(mockState).toHaveBeenCalledTimes(1);
        expect(mockState).toHaveBeenCalledWith('override', 101);
    });

    test('should restore the original method after being mocked', () => {
        const mockState = spyOnImplementation(targetObject, 'myMethod');
        (<any> mockState)._isMockFunction = true;
        (<any> mockState).getMockName = () => mockState.name;

        // Mock the method
        mockState.mockImplementation((arg1, arg2) => `Temporary Mock: ${ arg1 }, ${ arg2 }`);

        // Ensure the mocked method is working
        expect(targetObject.myMethod('temp', 0)).toBe('Temporary Mock: temp, 0');
        expect(mockState).toHaveBeenCalledWith('temp', 0);
        mockState.mockRestore();

        // Ensure the original method is back
        expect(targetObject.myMethod('restored', 99)).toBe('Original: restored, 99');
    });
});

describe('spyOn for getters and setters', () => {
    let targetObject: { value: string };

    beforeEach(() => {
        targetObject = {
            value: 'default'
        };
    });

    test('should spy on the getter function', () => {
        // Spy on the getter of the "value" property
        const getterSpy = spyOnImplementation(targetObject, 'value');
        (<any> getterSpy)._isMockFunction = true;
        (<any> getterSpy).getMockName = () => getterSpy.name;

        // Mock the getter to return a custom value
        getterSpy.mockImplementation(() => 'mocked getter');

        // Assert the custom value is returned
        expect(targetObject.value).toBe('mocked getter');

        // Verify the mock state tracks calls
        expect(getterSpy).toHaveBeenCalledTimes(1);
    });

    test('should spy on the setter function', () => {
        // Spy on the setter of the "value" property
        const setterSpy = spyOnImplementation(targetObject, 'value');
        (<any> setterSpy)._isMockFunction = true;
        (<any> setterSpy).getMockName = () => setterSpy.name;

        // Mock the setter to track its usage but not change the value
        setterSpy.mockImplementation(((newValue: string) => {
            console.log(`Setter called with: ${ newValue }`);
        }) as any);

        // Use the setter
        targetObject.value = 'new value';

        // Verify the mock state tracks calls
        expect(setterSpy).toHaveBeenCalledTimes(1);
        expect(setterSpy).toHaveBeenCalledWith('new value');
        expect(targetObject.value).toBe('new value');
    });

    test('should restore the original getter and setter', () => {
        // Spy on the getter and setter
        const spy = spyOnImplementation(targetObject, 'value');
        (<any> spy)._isMockFunction = true;
        (<any> spy).getMockName = () => spy.name;

        spy.mockImplementation(((newValue: string) => {
            console.log(`Setter called with: ${ newValue }`);

            return 'mock string';
        }) as any);

        // Use the mocked getter and setter
        targetObject.value = 'new value';
        expect(spy).toHaveBeenCalledWith('new value');
        expect(targetObject.value).toBe('new value');
        expect(spy).toHaveBeenCalledTimes(2);

        // Restore getters and setters
        spy.mockRestore();

        // Now use the original getter and setter behavior
        targetObject.value = 'restored value';
        expect(targetObject.value).toBe('restored value');
    });
});

describe('spyOn', () => {
    test('should throw an error when target is null or undefined', () => {
        expect(() => spyOnImplementation(null as any, 'method')).toThrow(
            'Target must be an object or function'
        );
        expect(() => spyOnImplementation(undefined as any, 'method')).toThrow(
            'Target must be an object or function'
        );
    });

    test('should throw an error when no property name is supplied', () => {
        const target = {};
        // @ts-expect-error null is not a valid type of spyOn
        expect(() => spyOnImplementation(target, null)).toThrow('Spied property/method key is required');
    });

    test('should throw an error when the property does not exist', () => {
        const target = { method: () => 'test' };
        expect(() => spyOnImplementation(target, 'missingKey' as any)).toThrow(
            'Property/method \'missingKey\' does not exist on target'
        );
    });

    test('should spy on a target object method', () => {
        const target = {
            greet(name: string) {
                return `Hello, ${ name }`;
            }
        };

        // Spy on the `greet` method
        const spy = spyOnImplementation(target, 'greet');
        (<any> spy)._isMockFunction = true;
        (<any> spy).getMockName = () => spy.name;

        // Check that the spy is an instance of MockState
        expect(spy).toBeInstanceOf(MockState);

        // Mock the implementation of the greet method
        spy.mockImplementation((name: string) => `Hi, ${ name }!`);

        // Test the mocked method
        expect(target.greet('Alice')).toBe('Hi, Alice!');

        // Verify that the mock tracked the call
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('Alice');
    });

    test('should restore the original method after mocking', () => {
        const target = {
            greet(name: string) {
                return `Hello, ${ name }`;
            }
        };

        // Spy on the `greet` method
        const spy = spyOnImplementation(target, 'greet');

        // Mock the implementation
        spy.mockImplementation((name: string) => `Hi, ${ name }!`);

        // Call the mocked method
        expect(target.greet('Alice')).toBe('Hi, Alice!');

        // Restore the original implementation
        spy.mockRestore();

        // Call the restored method
        expect(target.greet('Alice')).toBe('Hello, Alice');
    });

    test('should spy on getters or setters and mock their behavior', () => {
        const target = {
            value: 'original'
        };

        // Spy on the getter
        const spy = spyOnImplementation(target, 'value');
        (<any> spy)._isMockFunction = true;
        (<any> spy).getMockName = () => spy.name;

        // Mock the getter
        spy.mockImplementation(() => 'mocked value');

        // Test the mocked getter
        expect(target.value).toBe('mocked value');
        target.value = 'new value';

        // Verify calls to the getter and setter
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(2, 'new value');
    });

    test('should create a mock for constructor-like properties', () => {
        const target = {
            MyClass: class {
                constructor(public name: string) {
                }
            }
        };

        // Spy on the class (constructor function)
        const spy = spyOnImplementation(target, 'MyClass');
        (<any> spy)._isMockFunction = true;
        (<any> spy).getMockName = () => spy.name;

        // Mock the constructor behavior
        spy.mockImplementation(((name: string) => {
            return { name, isMock: true };
        }) as any);

        // Test the mocked constructor
        const instance = new target.MyClass('Test');
        expect(instance).toEqual({ name: 'Test', isMock: true });

        // Verify constructor call tracking
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('Test');
    });
});
