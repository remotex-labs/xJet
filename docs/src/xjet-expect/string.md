# String Matchers
String matchers help you test string values, allowing you to check string content, patterns, and properties.

## toHaveLength
Checks if a string (or any object with a `length` property) has the expected length.

```ts
expect(value).toHaveLength(length)
```

### Parameters
- `length`: The expected length as a number or bigint

### Examples
```ts
// String length
expect('hello').toHaveLength(5)  // Passes
expect('').toHaveLength(0)  // Passes
expect('hi').not.toHaveLength(3)  // Passes

// Works with arrays too
expect(['a', 'b', 'c']).toHaveLength(3)  // Passes
expect(new Array(10)).toHaveLength(10)  // Passes

// Works with any object having a numeric length property
expect({ length: 5 }).toHaveLength(5)  // Passes
```

## toMatch
Checks if a string matches a substring or regular expression pattern.

```ts
expect(value).toMatch(expected)
```

### Parameters
- `expected`: A string substring or RegExp pattern to match against

### Examples

#### With String Substring
```ts
// Basic substring matching
expect('hello world').toMatch('world')  // Passes
expect('hello world').toMatch('hello')  // Passes
expect('hello world').not.toMatch('universe')  // Passes

// Case-sensitive by default
expect('Hello World').not.toMatch('hello')  // Passes
```

#### With Regular Expressions
```ts
// Basic regex matching
expect('hello world').toMatch(/world/)  // Passes

// Case-insensitive matching
expect('Hello World').toMatch(/hello/i)  // Passes

// Pattern matching
expect('abc123').toMatch(/^[a-z]+\d+$/)  // Passes
expect('user@example.com').toMatch(/^[\w.-]+@[\w.-]+\.\w+$/)  // Passes

// Negative matching
expect('hello world').not.toMatch(/^goodbye/)  // Passes
```

## Common Testing Patterns
### Format Validation

```ts
test('validates email format', () => {
  const email = 'user@example.com'
  expect(email).toMatch(/^[\w.-]+@[\w.-]+\.\w+$/)
})
```

### Content Verification
```ts
test('error message contains relevant information', () => {
  const error = getErrorMessage()
  expect(error).toMatch('invalid input')
  expect(error).toMatch(/at line \d+/)
})
```

### Length Constraints
```ts
test('username has valid length', () => {
  const username = 'johndoe'
  expect(username).toHaveLength(7)
  // Alternative approach using comparison
  expect(username.length).toBeGreaterThanOrEqual(3)
  expect(username.length).toBeLessThanOrEqual(20)
})
```
