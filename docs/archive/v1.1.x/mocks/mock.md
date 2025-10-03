# xJet.mock – Mock Any Global Function, Method, or Constructor

The `xJet.mock()` utility enables you to replace existing global or object-bound functions,
class methods, or constructors with powerful, controllable mocks.
This allows you to intercept invocations, inspect arguments/results,
return custom values, and later restore the original behavior seamlessly.

## What Does xJet.mock Do?

- **Swaps out** an existing function or constructor with a controllable mock.
- **Tracks** calls, arguments, results, and instances.
- **Customizes** behavior: supply new logic (mock implementation), return values, or errors.
- **Restores** the original implementation at any time.

## Mocking a Regular Function

```ts
function sayHello(name) {
    return `Hello, ${ name }!`;
}

test('some test', () => {
    const sayHelloMock = xJet.mock(sayHello);
    sayHelloMock.mockImplementation(() => 'Hi!');

    expect(sayHello('Bob')).toBe('Hi!');

    sayHelloMock.mockRestore();
    expect(sayHello('Bob')).toBe('Hello, Bob!');
});
```

## Mocking a Constructor

```ts
class User {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

test('some test', () => {
    const userMock = xJet.mock(User);
    userMock.mockImplementation((name) => ({ name: name + ' (mocked)' }));

    const instance = new User('Alice');
    expect(instance.name).toBe('Alice (mocked)');

    userMock.mockRestore();
    const real = new User('Alice');
    expect(real.name).toBe('Alice');
});
```

## Mocking Global/Static Methods

You can use `xJet.mock()` to mock any function on the `globalThis` scope or within objects.

## API Overview

The returned mock exposes all `MockState` methods and properties, providing extensive control and insight:

| Method / Property            | Description                                                                           |
|------------------------------|---------------------------------------------------------------------------------------|
| `mockReturnValue(value)`     | Always returns `value` when called.                                                   |
| `mockReturnValueOnce(value)` | Returns `value` for the next call, then goes back to the default/mock implementation. |
| `mockImplementation(fn)`     | Sets or replaces the implementation function/logic.                                   |
| `mockImplementationOnce(fn)` | Sets an implementation only valid for the next call.                                  |
| `mockResolvedValue(value)`   | Returns a resolved Promise with `value` (async).                                      |
| `mockRejectedValue(error)`   | Returns a rejected Promise with value/error (async).                                  |
| `mockRestore()`              | Restores the original function/constructor.                                           |
| `mockReset()`                | Completely resets mock state and history.                                             |
| `mockClear()`                | Clears all collected call data only, keeping the implementation.                      |
| `getMockImplementation()`    | Gets the current implementation.                                                      |
| `original(...args)`          | Directly call the original unmocked function/constructor.                             |
| `mock.calls`                 | Array of all calls (`[[args1], [args2], ...]`).                                       |
| `mock.results`               | Array of call results: `{ type: "return", value: "throw" }`.                          |
| `mock.instances`             | Constructed instances if used as a constructor.                                       |
| `mock.contexts`              | Value of `this` for each call.                                                        |
| `getMockName()`              | Returns name of the mock (for compatibility/testing utilities).                       |

## Features

- **Non-invasive:** You can always recover the original implementation.
- **Flexible:** Works with both plain functions and constructors.
- **Fine control:** Use `.mockImplementationOnce()` or `.mockReturnValueOnce()` for per-call overrides.
- **Tracking:** Access full call/instance history for assertions in your tests.

## Best Practices

- Always call `.mockRestore()` at the end of your test to clean up!
- If mocking fails (e.g., non-global or already replaced), check that the target is referenced correctly.

## See Also

- [xJet.fn](./fn.md)
- [xJet.spy](./spy.md)
