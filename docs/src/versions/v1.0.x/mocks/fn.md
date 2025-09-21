# Fn

The `xJet.fn()` utilities let you create highly configurable mocks for functions, constructors, or methods. 
These mocks let you track calls, control behavior, and replace implementation logic for powerful and isolated testing scenarios.

## Overview

- Quickly mock standalone functions, methods, or class constructors.
- Capture call arguments, return values, invocation order, and more.
- Swap between original and mocked behavior with `.mockRestore()`.
- Support for both function-like and constructor-like mocks.

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

- [Spy API](/mocks/spy)
- [Mock](/mocks/mock)


