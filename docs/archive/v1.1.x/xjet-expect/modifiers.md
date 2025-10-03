# Modifiers

Modifiers enhance your test assertions by adapting matcher behavior for different scenarios. T
hey connect your `expect()` statement to the actual matcher, allowing for more flexible and powerful tests in your xJet test suites.

## not

Inverts your assertion to verify that something is false rather than true.

```ts
test('verifies incorrect password is rejected', () => {
    // Check authentication fails with wrong credentials
    expect(authenticate('user', 'wrong_password')).not.toBeTruthy();

    // Verify element is not in the expected state
    expect(component.getStatus()).not.toBe('ready');
});

```

## resolves

Unwraps a fulfilled promise's value so you can test the resolved result directly.

```ts
test('API request completes successfully', async () => {
    // Using async/await - recommended approach
    await expect(api.fetchData('/users')).resolves.toMatchObject({
        success: true,
        count: expect.any(Number)
    });

    // Alternative approach with Promise.then()
    return expect(api.fetchConfig()).resolves.toHaveProperty('version');
});

```

::: tip
**Best Practice:** The async/await syntax is generally more readable than the return approach.
It allows for cleaner test organization, especially when you need to perform additional assertions after the promise resolves.
:::

## rejects

Tests that a promise rejects and allow you to verify the rejection reason.
The modifier works with both promises that explicitly call `reject()` and those that throw exceptions inside the promise executor. `.rejects`

### Promise rejection patterns

xJet treats these rejection patterns equivalently with : `.rejects`

```ts
// Pattern 1: Explicit rejection with reject()
function explicitReject(): Promise<any> {
    return new Promise((resolve, reject) => {
        reject('error message');
    });
}

// Pattern 2: Throwing inside promise executor
function throwInPromise(): Promise<any> {
    return new Promise((resolve, reject) => {
        throw 'error message';
    });
}

// Both can be tested the same way
test('promise rejection patterns', async () => {
    await expect(explicitReject()).rejects.toBe('error message');
    await expect(throwInPromise()).rejects.toBe('error message');
});

```

You can use either `toBe()` to match the exact rejection value or for error-like objects: `toThrow()`

```ts
test('different assertion styles with rejects', async () => {
  // When rejecting with a string
  function rejectWithString(): Promise<any> {
    return new Promise((resolve, reject) => {
      reject('validation failed');
    });
  }
  
  // These assertions are equivalent
  await expect(rejectWithString()).rejects.toBe('validation failed');
  await expect(rejectWithString()).rejects.toThrow('validation failed');
  
  // When rejecting with an Error object
  function rejectWithError(): Promise<any> {
    return new Promise((resolve, reject) => {
      reject(new Error('network error'));
    });
  }
  
  // These assertions work for Error objects
  await expect(rejectWithError()).rejects.toThrow('network error');
  await expect(rejectWithError()).rejects.toBeInstanceOf(Error);
});

```

::: info
While both `toBe` and can be used with,
using is generally preferred when testing Error objects as it provides better error messages and can check error types `toThrow()`, `.rejects`, `toThrow()`
:::

## Combining Modifiers

You can use modifiers together with various matchers to create powerful assertions:

```ts
test('demonstrates advanced modifier usage', async () => {
  // Verify a promise resolves to a non-null value
  await expect(storage.getSettings()).resolves.not.toBeNull();
  
  // Verify a function doesn't throw under valid conditions
  expect(() => parser.parseConfig('{"valid": true}')).not.toThrow();
  
  // Verify an async operation doesn't resolve with a specific error state
  await expect(permissions.check('admin')).resolves.not.toEqual({
    denied: true
  });
});

```
