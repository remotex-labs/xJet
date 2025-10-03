# Asymmetric Matchers

Asymmetric matchers provide flexible ways to verify that values meet certain conditions without requiring exact equality.
They're especially useful when only certain aspects of an object need validation or when dealing with dynamic data.

## Basic Usage

Asymmetric matchers can be used in any xJet assertion that compares values:

```ts
test('user data has expected structure', () => {
  const user = fetchUser(123);
  
  expect(user).toEqual({
    id: 123,
    name: expect.any(String),
    createdAt: expect.any(Date),
    status: 'active'
  });
});

```

## Where Asymmetric Matchers Can Be Used

Asymmetric matchers work with multiple matchers across the xJet testing framework:

```ts
// In equality assertions
expect({ name: 'Alice' }).toEqual({ name: expect.any(String) });

// In function call assertions
expect(mockFunction).toHaveBeenCalledWith(expect.objectContaining({ id: 123 }));

// In strict equality checks (only at root level)
expect({ name: 'Alice' }).toBe(expect.any(Object));

// In exception testing
expect(() => validateEmail('')).toThrow(expect.objectContaining({ 
  code: 'VALIDATION_ERROR' 
}));

// In array content assertions
expect(['apple', 'banana']).toContainEqual(expect.stringMatching(/^a/));

// In partial object matching
expect(response).toMatchObject({
  users: expect.arrayContaining([{ role: 'admin' }])
});

```

::: tip
Each matcher includes information about whether it supports **Asymmetric Matchers**.
:::

## any

`.any(constructor)`
Matches any value created by the specified constructor.

```ts
test('value type checking', () => {
    expect({ name: 'Alice' }).toEqual({ name: expect.any(String) });
    expect(Math.round(2)).toBe(expect.any(Number));

    // With class instances
    class User {}
    const user = new User();
    expect(user).toEqual(expect.any(User));
});

```

## anything

`.anything()`
Matches any non-null, non-undefined value.

```ts
test('verifies value exists', () => {
  const response = { data: 'something', timestamp: Date.now() };
  
  expect(response).toEqual({
    data: expect.anything(),
    timestamp: expect.anything()
  });
});

```

## closeTo

`.closeTo(value, precision)`
Matches numbers that are close to a target value within a specified precision.

```ts
test('approximate calculations', () => {
  const result = 0.1 + 0.2; // 0.30000000000000004 due to floating-point
  
  expect(result).toEqual(expect.closeTo(0.3, 0.001));
});

```

## arrayOf

`.arrayOf(pattern)`
Matches an array where every element matches the specified pattern.

```ts
expect([ 'apple', 'banana', 'cherry' ]).toEqual(
    expect.arrayOf(expect.any(String)),
);
```

## stringMatching

`expect.stringMatching(pattern)`
Matches strings against a regular expression pattern.

```ts
test('string format validation', () => {
  const email = 'user@example.com';
  
  expect(email).toEqual(
    expect.stringMatching(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i)
  );
  
  // In objects
  const user = { email: 'admin@company.org', role: 'ADMIN' };
  expect(user).toEqual({
    email: expect.stringMatching(/.+@company\.org$/),
    role: expect.stringMatching(/^[A-Z]+$/)
  });
});
```

## arrayContaining

`expect.arrayContaining(items)`
Matches arrays that contain all the specified items, regardless of order.

```ts
test('array includes required elements', () => {
  const fruits = ['apple', 'banana', 'orange', 'grape'];
  
  expect(fruits).toEqual(expect.arrayContaining(['banana', 'apple']));
  
  // With response data
  const response = {
    users: ['admin', 'user1', 'user2'],
    permissions: ['read', 'write']
  };
  
  expect(response).toEqual({
    users: expect.arrayContaining(['admin']),
    permissions: expect.arrayContaining(['read', 'write'])
  });
});
```

## objectContaining

`.objectContaining(object)`
Matches objects that have at least the specified properties with matching values.

```ts
test('object structure validation', () => {
    const user = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        preferences: {
            theme: 'dark',
            notifications: true
        }
    };

    expect(user).toEqual(expect.objectContaining({
        name: 'John',
        preferences: expect.objectContaining({
            theme: 'dark'
        })
    }));
});
```

## stringContaining

`.stringContaining(substring)`
Matches strings that contain the specified substring.

```ts
test('string content validation', () => {
  const message = 'Operation completed successfully';
  
  expect(message).toEqual(expect.stringContaining('completed'));
  
  // With error messages
  const error = new Error('Invalid input: missing required field');
  expect(error.message).toEqual(expect.stringContaining('missing required'));
});

```

## Negated Matchers with `.not`

Use the namespace to negate any matcher's behavior: `.not`

```ts
test('using negated matchers', () => {
  const data = {
    temperature: 25.2,
    status: 'warning',
    tags: ['important', 'urgent']
  };
  
  // Value is not close to the specified number
  expect(data.temperature).toEqual(expect.not.closeTo(0, 1));
  
  // String doesn't match pattern
  expect(data.status).toEqual(expect.not.stringMatching(/^error/));
  
  // Array doesn't contain these elements
  expect(data.tags).toEqual(expect.not.arrayContaining(['low-priority']));
});

```
