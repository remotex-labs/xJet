# Fn

The `xJet.fn()` utilities let you create highly configurable mocks for functions, constructors, or methods.
These mocks let you track calls, control behavior, and replace implementation logic for powerful and isolated testing scenarios.

## Overview

- Quickly mock standalone functions, methods, or class constructors.
- Capture call arguments, return values, invocation order, and more.
- Swap between original and mocked behavior with `.mockRestore()`.
- Support for both function-like and constructor-like mocks.

::: warning
Mock functions created with `xJet.fn()` are not automatically tracked by the global mock management utilities: `xJet.restoreAllMocks()`, `xJet.resetAllMocks()`, and `xJet.clearAllMocks()`.

Additionally, when using `xJet.fn()` with object methods, it only creates a wrapped version of the method that can be mocked independently. It doesn't override the original method on the object. For example:

```ts
class Example {
    method() {
        console.log('original');
    }
}

const instance = new Example();
const mockMethod = xJet.fn(instance.method);

// Calling the mock wrapper
mockMethod(); // Prints: original

// Mocking the implementation
mockMethod.mockImplementation(() => {
    console.log('mocked');
});

mockMethod(); // Prints: mocked
instance.method(); // Still prints: original
```

To fully replace an object's method, consider using `xJet.spyOn()` or `xJet.mock()` with mock Implementation instead.
:::

## Basic Function Mock

```ts
test('some test', () => {
    const double = (x: number) => x * 2;
    const mockDouble = xJet.fn(double);
    mockDouble.mockReturnValueOnce(7);

    expect(mockDouble(10)).toBe(7);
    expect(mockDouble(10)).toBe(20);
});
```

## Mocking a Class Constructor

```ts
test('some test', () => {
    class User {
        name: string;
        
        constructor(name: string) {
            this.name = name;
        }

        sayHello() {
            return `Hi, ${ this.name }`;
        }
    }

    const userMock = xJet.fn<User, [ string ], User>();
    userMock.mockImplementation((name: string) => ({ name, sayHello: () => `Mocked ${ name }` }));
    
    
    const mockInstance = new userMock('Alice');
    expect(mockInstance.sayHello()).toBe('Mocked Alice');
});
```

## Restore Behavior

The `xJet.fn()` utilities provide powerful restoration capabilities that allow you to
switch between mocked and original implementations during testing.

```ts
test('restore example', () => {
    const double = (x: number) => x * 2;
    const mockDouble = xJet.fn(double);
    
    // Override with mock implementation
    mockDouble.mockImplementation(x => x + 10);
    expect(mockDouble(5)).toBe(15);
    
    // Restore to original implementation
    mockDouble.mockRestore();
    expect(mockDouble(5)).toBe(10);
});
```

### Custom Restore Functions

You can provide a custom restore function that follows one of two patterns:

#### 1. Restore with Side Effects (No Function Returns)

If your custom restore function doesn't return a function,
the mock will revert to its original implementation:

```ts
const mockWithSideEffects = xJet.fn(
    (x) => x * 2, // original implementation
    () => { // custom restore function with side effects only
        console.log('Custom restore called!');
        // No return value, so mock will revert to original implementation
    }
);

mockWithSideEffects.mockImplementation((x) => x * 3);
mockWithSideEffects(5); // Returns: 15

mockWithSideEffects.mockRestore(); 
// Prints: "Custom restore called!"
// Since restore() didn't return a function, mock reverts to original
console.log(mockWithSideEffects(5)); // Returns: 10
```

#### 2. Restore with Implementation (Function Return)

If your custom restore function returns a function,
that returned function becomes the new implementation:

```ts
const mockWithNewImpl = xJet.fn(
    (x) => x * 2, // original implementation 
    () => { // custom restore function that returns a new implementation
        console.log('Restoring with new implementation!');
        return (x): number => x * 4; // New implementation
    }
);

mockWithNewImpl.mockImplementation((x) => x * 3);
mockWithNewImpl(5); // Returns: 15

mockWithNewImpl.mockRestore(); 
// Prints: "Restoring with new implementation!"
// Since restore() returned a function, that function becomes the new implementation
console.log(mockWithNewImpl(5)); // Returns: 20 (using the new x * 4 implementation)
```

## API Overview

A mock created via `xJet.fn` (or `.mock`) exposes all `MockState` methods and properties for fine-grained control:

| Method / Property            | Description                                                                                |
|------------------------------|--------------------------------------------------------------------------------------------|
| `getMockName()`              | Returns the name of the mock (mainly for Jest compatibility).                              |
| `mock`                       | Read-only state with calls, instances, results, and more.                                  |
| `original`                   | Returns the original, unmocked function or constructor.                                    |
| `mockClear()`                | Clears all recorded call data, keeping the mock implementation.                            |
| `mockReset()`                | Resets the mock completely: clears calls, results, and queued behaviors.                   |
| `mockRestore()`              | Restores the function/constructor to its original (pre-mocked) implementation.             |
| `getMockImplementation()`    | Gets the current implementation of the mock, or `undefined` if none is set.                |
| `getNextImplementation()`    | Gets the next implementation in the queue, or falls back to the default mock/current impl. |
| `mockImplementation(fn)`     | Sets or replaces the mock's default function/logic.                                        |
| `mockImplementationOnce(fn)` | Adds a one-time function/implementation for the next call only.                            |
| `mockReturnValue(val)`       | Always returns the specified value.                                                        |
| `mockReturnValueOnce(val)`   | Returns value for the next call only, then reverts.                                        |
| `mockResolvedValue(val)`     | Always returns a resolved `Promise` with value when called.                                |
| `mockResolvedValueOnce(val)` | Next call returns resolved `Promise`, then reverts.                                        |
| `mockRejectedValue(val)`     | Always returns a rejected `Promise` with value.                                            |
| `mockRejectedValueOnce(val)` | Next call returns rejected `Promise`, then reverts.                                        |

## Quick API Table

| Task                           | How to Use                                |
|--------------------------------|-------------------------------------------|
| Create a mock function         | `const fn = xJet.fn()` or `xJet.fn(impl)` |
| Mock a specific implementation | `fn.mockImplementation(() => 5)`          |
| Mock a value                   | `fn.mockReturnValue('foo')`               |
| Mock a resolved value          | `fn.mockResolvedValue('ok')`              |
| Mock a rejected value          | `fn.mockRejectedValue('err')`             |
| Restore original               | `fn.mockRestore()`                        |
| Inspect calls                  | `fn.mock.calls`                           |
| Reset/clear collected state    | `fn.mockReset()` / `fn.mockClear()`       |

---

## See Also

- [Mock](/mocks/mock)
- [Spy API](/mocks/spy)
