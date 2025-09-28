# Equality Matchers

Equality matchers provide different ways to compare values in your tests, from strict equality to deep object comparison.

## toBe

Checks if the received value is strictly equal to the expected value using `Object.is()`.

```ts
expect(value).toBe(expected)
```

`toBe` is most appropriate when testing exact identity rather than structure.
::: info
:rocket: **Supports asymmetric matchers** - at the root level only
:::

### Examples

```ts
// Primitives
expect(2 + 2).toBe(4)
expect('hello').toBe('hello')
expect(true).toBe(true)

// Same object reference
const obj = { a: 1 }
expect(obj).toBe(obj)

// With asymmetric matchers
expect('hello world').toBe(expect.stringContaining('hello'))
expect(42).toBe(expect.any(Number))

```

### Common Mistakes

```ts
// This fails because they're different object references
expect({ a: 1 }).toBe({ a: 1 })

// This fails because they're different array references
expect([1, 2, 3]).toBe([1, 2, 3])
```

If you want to compare value equality for objects or arrays, use `toEqual` instead.

### Choosing Between toBe and toEqual

- Use `toBe` when you need to ensure it's exactly the same instance (reference equality)
- Use `toEqual` when you care about value equivalence rather than identity

```ts
// Use toBe for primitives
expect(2 + 2).toBe(4)

// Use toEqual for objects/arrays with the same content
expect({ id: 1, name: 'Test' }).toEqual({ id: 1, name: 'Test' })
```

## toEqual

Performs a deep equality check between the received and expected values.

```ts
expect(value).toEqual(expected)
```

`toEqual` recursively compares all properties of objects and elements of arrays, making it perfect for data structure validation.

::: info
:rocket: **Supports asymmetric matchers** - at any level of nesting
:::

```ts
// Objects with the same properties
expect({ name: 'Alice', age: 30 }).toEqual({ name: 'Alice', age: 30 })

// Nested objects
expect({ user: { name: 'Bob', permissions: ['read', 'write'] } })
  .toEqual({ user: { name: 'Bob', permissions: ['read', 'write'] } })

// Arrays
expect([1, 2, 3]).toEqual([1, 2, 3])

// With asymmetric matchers
expect({ name: 'Alice', created: new Date() }).toEqual({
  name: 'Alice',
  created: expect.any(Date)
})

// Nested asymmetric matchers
expect({ 
  user: { 
    id: 123, 
    posts: [{ title: 'Hello' }, { title: 'World' }] 
  } 
}).toEqual({
  user: {
    id: expect.any(Number),
    posts: expect.arrayContaining([
      expect.objectContaining({ title: 'Hello' })
    ])
  }
})

```

## toBeNull

Checks if the received value is exactly `null`.

```ts
expect(value).toBeNull()
```

```ts
expect(null).toBeNull()
expect(undefined).not.toBeNull()
expect(0).not.toBeNull()
expect('').not.toBeNull()
```

## toBeUndefined

Checks if the received value is exactly `undefined`.

```ts
expect(value).toBeUndefined()
```

```ts
expect(undefined).toBeUndefined()
expect(void 0).toBeUndefined()
expect(null).not.toBeUndefined()
expect(0).not.toBeUndefined()
```

## toBeDefined

Checks if the received value is not `undefined`.

```ts
expect(null).toBeDefined()
expect(0).toBeDefined()
expect('').toBeDefined()
expect(false).toBeDefined()
expect(undefined).not.toBeDefined()

```

## toBeNaN

Checks if the received value is `NaN`.

```ts
expect(value).toBeNaN()
```

```ts
expect(NaN).toBeNaN()
expect(0/0).toBeNaN()
expect(parseInt('not a number')).toBeNaN()
expect(42).not.toBeNaN()
```

## toBeTruthy

Checks if the received value is truthy (evaluates to true in a boolean context).

```ts
expect(value).toBeTruthy()
```

```ts
expect(true).toBeTruthy()
expect(1).toBeTruthy()
expect('hello').toBeTruthy()
expect({}).toBeTruthy()
expect([]).toBeTruthy()

expect(false).not.toBeTruthy()
expect(0).not.toBeTruthy()
xExpect('').not.toBeTruthy()
xExpect(null).not.toBeTruthy()
xExpect(undefined).not.toBeTruthy()
```

## toBeFalsy

Checks if the received value is falsy (evaluates to false in a boolean context).

```ts
xExpect(false).toBeFalsy()
xExpect(0).toBeFalsy()
xExpect('').toBeFalsy()
xExpect(null).toBeFalsy()
xExpect(undefined).toBeFalsy()
xExpect(NaN).toBeFalsy()

xExpect(true).not.toBeFalsy()
xExpect(1).not.toBeFalsy()
xExpect('hello').not.toBeFalsy()
xExpect({}).not.toBeFalsy()
xExpect([]).not.toBeFalsy()

```
