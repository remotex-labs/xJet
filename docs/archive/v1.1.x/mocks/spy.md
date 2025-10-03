# Spy

The **Spy** mock allow you to intercept, mock, and observe function and property behavior on objects, classes,
or constructors. They are commonly used to track function calls, monitor property access,
and mock or override return values for testing purposes.

## Overview

A spy wraps a function, property, or constructor so you can:

- Monitor calls, arguments, and usage.
- Mock implementations or return values for controlled testing.
- Restore original behavior after the test, if needed.

Spies can be applied to:

- **Object methods or properties** (instance or static)
- **Static properties/methods on classes**
- **Constructors**

The spy returns a `MockState` object, letting you control and inspect the spy's behavior and usage stats.

## Spying on Object Methods and Properties

```ts
const obj = {
    myMethod(domeData: any) {
        return `original ${ domeData }`;
    },
    myValue: 'original'
};

test('some test', () => {
    const methodSpy = xJet.spyOn(obj, 'myMethod');
    const valueSpy = xJet.spyOn(obj, 'myValue');

    methodSpy.mockReturnValueOnce('some data');
    valueSpy.mockReturnValueOnce('original2');

    obj.myMethod('test');
    expect(methodSpy).toHaveLastReturnedWith('some data');

    obj.myMethod('test');
    expect(methodSpy).toHaveBeenCalledWith('test');
    expect(methodSpy).toHaveLastReturnedWith('original test');

    console.log(obj.myValue);
    expect(valueSpy).toHaveLastReturnedWith('original2');

    console.log(obj.myValue);
    expect(valueSpy).toHaveLastReturnedWith('original');
});
```

## Spying on Class Static Properties or Methods

```ts
class Example {
    static staticProp = 'original';

    static staticMethod(x: number) {
        return x + 1;
    }
}

test('some test', () => {
    const staticPropSpy = xJet.spyOn(Example, 'staticProp');
    const staticMethodSpy = xJet.spyOn(Example, 'staticMethod');

    staticPropSpy.mockReturnValueOnce('changed!');
    staticMethodSpy.mockImplementationOnce(x => x * 2);

    expect(Example.staticProp).toBe('changed!');
    expect(Example.staticMethod(3)).toBe(6);
});
```

## Global Mock Utilities

These helpers operate on **all active spies/mocks** in your test environment. Use them to reset, clear, or restore mocks in bulk, such as in setup or cleanup hooks:

| Function                 | What it does                                                                | Typical Use Case                                 |
|--------------------------|-----------------------------------------------------------------------------|--------------------------------------------------|
| `xJet.clearAllMocks()`   | Clears usage data for all mocks (calls, instances, etc).                    | Call histories cleared; behavior remains mocked. |
| `xJet.resetAllMocks()`   | Resets usage data and restores default/mock behavior (but doesn't un-mock). | Use between tests for a fresh state.             |
| `xJet.restoreAllMocks()` | Restores all mocks to their original implementation and removes the spy.    | Cleanup after testing to restore real behavior.  |

**Example:**

```ts
afterEach(() => {
    xJet.clearAllMocks();
});

afterAll(() => {
    xJet.restoreAllMocks();
});
```

## Async mocking:

```ts
test('some test', async () => {
    const asyncMock = xJet.fn(async () => 'done');
    asyncMock.mockResolvedValueOnce('first');
    asyncMock.mockResolvedValue('always');

    await expect(asyncMock()).resolves.toBe('first');
    await expect(asyncMock()).resolves.toBe('always');
});
```

## MockState API

Each spy or mock exposes many methods and getters for powerful mocking and inspection:

| Method / Property              | Description                                                                                                                            |
|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `getMockName()`                | *(for compatibility, no-op)* Returns the name of the mock. Usually for Jest compatibility. *(Currently always returns a placeholder.)* |
| `mock`                         | Returns the current state and metadata for the mock (calls, instances, contexts, etc).                                                 |
| `original`                     | Returns the original, unwrapped function or implementation before it was mocked. Great for debugging.                                  |
| `mockClear()`                  | Clears all call/instance/result history. Use to remove traces of previous invocations, but keeps the current implementation.           |
| `mockReset()`                  | Resets the mock function to its initial state: clears all history & queued behaviors. Ready for new configuration.                     |
| `mockRestore()`                | Restores the mock to the original implementation, clears state, and disables further mocking.                                          |
| `getMockImplementation()`      | Returns the current mock implementation function, or `undefined` if none is set.                                                       |
| `getNextImplementation()`      | Returns the next (possibly one-time) implementation, or falls back to the default/mock implementation (if any).                        |
| `mockImplementation(fn)`       | Sets or replaces the main mock implementation.                                                                                         |
| `mockImplementationOnce(fn)`   | Queues a one-time implementation for just the next call.                                                                               |
| `mockReturnValue(value)`       | Mocks the default return value for all future calls.                                                                                   |
| `mockReturnValueOnce(value)`   | Queues a return value to be used once on the next call.                                                                                |
| `mockResolvedValue(value)`     | Like `mockReturnValue`, but always returns a `Promise` resolved to that value.                                                         |
| `mockResolvedValueOnce(value)` | Like `mockReturnValueOnce`, but for resolved `Promise` values (one time only).                                                         |
| `mockRejectedValue(value)`     | Sets the mock to always return a rejected `Promise` with the value.                                                                    |
| `mockRejectedValueOnce(value)` | Sets the mock to return a rejected `Promise` with the value, only once.                                                                |

### Examples

Set up a basic mock:

```ts
test('some test', () => {
    const mockFn = xJet.fn<any, any, any>((x) => x * 2);
    mockFn.mockImplementationOnce(() => 42);
    mockFn.mockReturnValueOnce('abc');
    mockFn.mockReturnValue('always');

    mockFn(10); // 42 (from mockImplementationOnce)
    mockFn(10); // 'abc' (from mockReturnValueOnce)
    mockFn(10); // 'always' (from mockReturnValue)
    mockFn.original(10); // 20 (original, unmocked function)
});
```

## Typical Workflow Table

| Task                       | How to Use                                     |
|----------------------------|------------------------------------------------|
| Spy on a method            | `spy = xJet.spyOn(obj, 'method')`              |
| Spy on a property          | `spy = xJet.spyOn(obj, 'property')`            |
| Spy on static class method | `spy = xJet.spyOn(Class, 'staticMethod')`      |
| Spy on constructor         | `spy = xJet.spyOn(obj, 'ConstructorName')`     |
