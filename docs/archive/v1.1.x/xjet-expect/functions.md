# Function Matchers

Function matchers allow you to test function behavior, particularly for error handling and exceptions.

## toThrow

Checks if a function throws an error when executed. This matcher can verify that exceptions are properly thrown and that they match expected criteria.

```ts
expect(fn).toThrow(expected?)
```

The `expected` parameter is optional and versatile, allowing you to check different aspects of the thrown error.

::: info
:rocket: **Supports asymmetric matchers**
:::

### Parameters

- `expected`: (Optional) The expected error criteria, which can be:
  - Constructor function (e.g., `Error`, `TypeError`)
  - String substring that should be in the error message
  - RegExp pattern to match against the error message
  - Object to match with the thrown error
  - Asymmetric matcher

### Basic Usage

```ts
// Test that a function throws any error
expect(() => { throw new Error('oops') }).toThrow()
expect(() => { console.log('ok') }).not.toThrow()
```

### With Error Constructors

```ts
// Test for specific error types
expect(() => { throw new TypeError('invalid type') }).toThrow(TypeError)
expect(() => { throw new RangeError('out of bounds') }).toThrow(RangeError)
expect(() => { throw new Error('oops') }).not.toThrow(SyntaxError)

// With custom error classes
class ValidationError extends Error {}
expect(() => { throw new ValidationError('invalid data') }).toThrow(ValidationError)
```

### With String Messages

```ts
// Test for error message content
expect(() => { throw new Error('invalid password') }).toThrow('password')
expect(() => { throw new Error('File not found') }).toThrow('not found')
expect(() => { throw new Error('Connection failed') }).not.toThrow('success')
```

### With RegExp Patterns

```ts
// Test error message patterns
expect(() => { throw new Error('invalid email: user@example') }).toThrow(/invalid email/)
expect(() => { throw new Error('Code: 404, Not Found') }).toThrow(/Code: \d+/)
expect(() => { throw new Error('API Error: Rate limit exceeded') }).not.toThrow(/permission denied/i)
```

### With Objects

```ts
// Test for object properties
expect(() => { 
  throw { code: 'AUTH_FAILED', message: 'Invalid credentials' }
}).toThrow({ 
  code: 'AUTH_FAILED', 
  message: 'Invalid credentials' 
})

// Works with Error objects too
expect(() => { 
  const err = new Error('Permission denied')
  err.code = 403
  throw err
}).toThrow(expect.objectContaining({ 
  message: 'Permission denied',
  code: 403
}))

expect(() => {
    throw new Error('Permission denied');
}).toThrow({
    message: 'Permission denied',
    stack: expect.any(String),
    name: 'Error'
})
```

### With Asymmetric Matchers

```ts
expect(() => { 
  throw { 
    status: 404, 
    errors: ['Resource not found', 'Check the URL']
  }
})
  .toThrow(expect.objectContaining({ 
    status: expect.any(Number),
    errors: expect.arrayContaining(['Resource not found'])
  }))
```

## Usage with Promises

When testing async functions and promises, you can combine `toThrow` with the `rejects` modifier:

```ts
// Testing rejected promises
await expect(Promise.reject(new Error('Failed'))).rejects.toThrow('Failed')
await expect(Promise.reject(new TypeError('Type error'))).rejects.toThrow(TypeError)

// With async functions
await expect(async () => {
  throw new Error('Async error')
}).rejects.toThrow('Async error')
```

## Common Patterns and Best Practices

### Testing Error Boundaries

``` ts
test('component error boundary catches rendering errors', () => {
  const errorSpy = xJet.spyOn(console, 'error').mockImplementation(() => {})
  
  expect(() => {
    render(<BrokenComponent />)
  }).toThrow('Failed to render')
  
  errorSpy.mockRestore()
})
```

### Validating Input Parameters

``` ts
test('validateEmail throws for invalid emails', () => {
  expect(() => validateEmail('')).toThrow('Email cannot be empty')
  expect(() => validateEmail('invalid')).toThrow('Invalid email format')
  expect(() => validateEmail('user@example.com')).not.toThrow()
})
```

### Testing Error States in API Calls

``` ts
test('API client throws meaningful errors', async () => {
  // Mock failed network request
  fetchMock.mockRejectedValueOnce(new Error('Network failure'))
  
  await expect(api.getUser(123)).rejects.toThrow('Network failure')
  
  // Mock 404 response
  fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not Found' }), { status: 404 })
  
  await expect(api.getUser(999)).rejects.toThrow(/not found/i)
})
```

### Testing Custom Error Classes

``` ts
test('database operations throw specific errors', () => {
  class DatabaseError extends Error {
    constructor(message: string, public code: string) {
      super(message)
      this.name = 'DatabaseError'
    }
  }
  
  const connectToDb = (config: unknown) => {
    throw new DatabaseError('Connection failed', 'DB_CONN_ERROR')
  }
  
  expect(() => connectToDb({})).toThrow(DatabaseError)
  expect(() => connectToDb({})).toThrow('Connection failed')
  expect(() => connectToDb({})).toThrow(expect.objectContaining({ 
    code: 'DB_CONN_ERROR' 
  }))
})
```

### Testing Error Chains

``` ts
test('processPayment forwards underlying errors', () => {
  // Mock payment processor that throws
  const paymentProcessor = {
    charge: () => { throw new Error('Insufficient funds') }
  }
  
  const processPayment = (amount: number) => {
    try {
      paymentProcessor.charge(amount)
    } catch (err) {
      throw new Error(`Payment failed: ${err.message}`)
    }
  }
  
  expect(() => processPayment(100)).toThrow('Payment failed: Insufficient funds')
})
```
