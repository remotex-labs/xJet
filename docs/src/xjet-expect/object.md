# Object Matchers
Object matchers allow you to test properties, structures, and relationships of objects and arrays in your tests.

## toHaveProperty
Checks if an object has a specified property path, and optionally that the value at that path equals the expected value.

``` ts
expect(object).toHaveProperty(path, value?)
```

::: info
:rocket: **Supports asymmetric matchers**
:::

### Parameters
- `path`: String with dot notation or array of strings representing the property path
- `value`: (Optional) Expected value at the given path

### Examples
``` ts
// Basic property checks
expect({ name: 'John' }).toHaveProperty('name')
expect({ user: { id: 123 } }).toHaveProperty('user.id')

// With arrays
expect({ users: ['John', 'Jane'] }).toHaveProperty('users.0', 'John')
expect({ data: [{ id: 1 }] }).toHaveProperty(['data', 0, 'id'], 1)

// With expected values
expect({ age: 25 }).toHaveProperty('age', 25)
expect({ settings: { theme: 'dark' } }).toHaveProperty('settings.theme', 'dark')

// Negated cases
expect({ name: 'John' }).not.toHaveProperty('age')
expect({ user: { role: 'admin' } }).not.toHaveProperty('user.permissions')
```

### Using Array Notation
You can use either dot notation or array notation for nested properties:

``` ts
// These are equivalent
expect(obj).toHaveProperty('user.profile.name')
expect(obj).toHaveProperty(['user', 'profile', 'name'])

// Array notation is useful when property names contain dots
expect({ 'user.name': 'John' }).toHaveProperty(['user.name'])
```

## toBeInstanceOf
Checks if a value is an instance of a specified class or constructor function.

``` ts
expect(value).toBeInstanceOf(constructor)
```

### Parameters
- `constructor`: The expected constructor function or class

### Examples
``` ts
// Built-in JavaScript classes
expect(new Date()).toBeInstanceOf(Date)
expect([1, 2, 3]).toBeInstanceOf(Array)
expect(new Map()).toBeInstanceOf(Map)
expect(new Set([1, 2])).toBeInstanceOf(Set)
expect(new Error()).toBeInstanceOf(Error)
expect(/abc/).toBeInstanceOf(RegExp)

// Custom classes
class User {
  constructor(name) {
    this.name = name
  }
}
expect(new User('John')).toBeInstanceOf(User)

// Inheritance
class Admin extends User {}
expect(new Admin('Jane')).toBeInstanceOf(User)
expect(new Admin('Jane')).toBeInstanceOf(Admin)

// Negative cases
expect({}).not.toBeInstanceOf(Array)
expect('string').not.toBeInstanceOf(Number)
expect(null).not.toBeInstanceOf(Object)
```

## toContain
Checks if an array contains a specific element or if a string contains a specific substring.

``` ts
expect(arrayOrString).toContain(value)
```

### Parameters
- `value`: The expected item or substring to find

### Examples

#### With Arrays
``` ts
// Simple values in array
expect([1, 2, 3]).toContain(2)
expect(['apple', 'banana', 'orange']).toContain('banana')

// Reference equality for objects
const obj = { id: 1 }
expect([obj, { id: 2 }]).toContain(obj)  // Passes - same reference
expect([{ id: 1 }, { id: 2 }]).not.toContain({ id: 1 })  // Fails - different reference

// With strings in arrays
expect(['hello', 'world']).toContain('hello')
```

#### With Strings
``` ts
// Substring matching
expect('hello world').toContain('world')
expect('testing is important').toContain('testing')
expect('apple banana orange').toContain('banana')

// Case sensitivity
expect('Hello World').not.toContain('hello')  // Case-sensitive by default
```

### Common Mistakes
When checking for objects or arrays in an array, `toContain` uses reference equality, not structural equality:

``` ts
// This will fail despite structural equality
expect([{ a: 1 }, { b: 2 }]).toContain({ a: 1 })

// Use toContainEqual instead for structural equality
expect([{ a: 1 }, { b: 2 }]).toContainEqual({ a: 1 })
```

## toContainEqual
Checks if an array contains an element that is deeply equal to the expected value.

``` ts
expect(array).toContainEqual(value)
```

::: info
:rocket: **Supports asymmetric matchers**
:::

### Parameters
- `value`: The expected value to find in the array (using deep equality)

### Examples
``` ts
// Basic object equality
expect([{ a: 1 }, { b: 2 }]).toContainEqual({ a: 1 })
expect([{ name: 'John', age: 30 }]).toContainEqual({ name: 'John', age: 30 })

// Nested objects
expect([
  { user: { name: 'John', role: 'admin' } }
]).toContainEqual({ 
  user: { name: 'John', role: 'admin' } 
})

// With arrays
xExpect([[1, 2], [3, 4]]).toContainEqual([1, 2])

// With asymmetric matchers
xExpect([
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' }
]).toContainEqual(
  xExpect.objectContaining({ name: 'John' })
)

// Multiple properties
xExpect([
  { id: 1, status: 'active', role: 'admin' },
  { id: 2, status: 'inactive', role: 'user' }
]).toContainEqual(
  xExpect.objectContaining({
    status: 'active',
    role: xExpect.stringContaining('admin')
  })
)
```

## toMatchObject
Checks if an object matches the expected object by performing a deep partial equality comparison.

``` ts
xExpect(object).toMatchObject(expected)
```
::: info
:rocket: **Supports asymmetric matchers**
:::

### Parameters
- `expected`: The partial object to match against

### Examples
``` ts
// Basic object matching
xExpect({ name: 'John', age: 30 }).toMatchObject({ name: 'John' })
xExpect({ a: 1, b: 2, c: 3 }).toMatchObject({ a: 1, c: 3 })

// Nested objects
xExpect({
  user: {
    name: 'John',
    profile: { role: 'admin', active: true }
  }
}).toMatchObject({
  user: {
    name: 'John',
    profile: { role: 'admin' }
  }
})

// With arrays
xExpect({
  users: ['John', 'Jane', 'Bob']
}).toMatchObject({
  users: ['John', 'Jane']
})

// With asymmetric matchers
xExpect({
  id: 123,
  user: {
    name: 'John',
    age: 30,
    created: new Date('2023-01-01')
  }
}).toMatchObject({
  user: {
    name: xExpect.stringContaining('Jo'),
    age: xExpect.any(Number),
    created: xExpect.any(Date)
  }
})
```

### Important Notes
- `toMatchObject` checks that the received object contains all the properties in the expected object with equal values
- Properties not specified in the expected object are ignored
- The comparison is deep, including nested objects and arrays
- This matcher works well for testing a subset of an object's properties

``` ts
// This passes because all expected properties match
xExpect({
  name: 'John',
  age: 30,
  address: '123 Main St' // Extra property ignored
}).toMatchObject({
  name: 'John',
  age: 30
})

// This fails because expected has more properties than received
xExpect({
  name: 'John'
}).not.toMatchObject({
  name: 'John',
  age: 30
})
```

## Common Testing Patterns

### Testing API Responses
``` ts
test('API returns correct user data', async () => {
  const response = await fetchUser(123)
  
  xExpect(response).toMatchObject({
    id: 123,
    name: xExpect.any(String),
    email: xExpect.stringMatching(/^.+@.+\..+$/),
    created: xExpect.any(Date)
  })
})
```

### Validating Object Structur
``` ts
test('config object has required properties', () => {
  const config = loadConfig()
  
  xExpect(config).toHaveProperty('api.url')
  xExpect(config).toHaveProperty('api.timeout', 5000)
  xExpect(config).toHaveProperty('debug', false)
})
```
### Testing Class Instances
``` ts
test('factory creates correct instance types', () => {
  const factory = new ShapeFactory()
  
  const circle = factory.create('circle')
  xExpect(circle).toBeInstanceOf(Circle)
  
  const square = factory.create('square')
  xExpect(square).toBeInstanceOf(Square)
  xExpect(square).toBeInstanceOf(Shape)  // inheritance
})
```

### Filtering Collections
``` ts
test('filter returns matching items', () => {
  const items = [
    { id: 1, status: 'active', type: 'user' },
    { id: 2, status: 'inactive', type: 'admin' },
    { id: 3, status: 'active', type: 'admin' }
  ]
  
  const result = filterItems(items, { status: 'active', type: 'admin' })
  
  // Check if the result contains the expected item
  xExpect(result).toContainEqual(
    xExpect.objectContaining({ id: 3, status: 'active', type: 'admin' })
  )
  
  // Check that we don't have other items
  xExpect(result).not.toContainEqual(
    xExpect.objectContaining({ id: 1 })
  )
})
```

### Combining Matchers
``` ts
test('user object has correct structure and values', () => {
  const user = {
    id: 123,
    name: 'John Doe',
    roles: ['admin', 'editor'],
    profile: {
      email: 'john@example.com',
      settings: { theme: 'dark', notifications: true }
    }
  }
  
  // Check basic structure
  xExpect(user).toHaveProperty('id', 123)
  xExpect(user).toHaveProperty('name')
  xExpect(user).toHaveProperty('profile.email')
  
  // Check array content
  xExpect(user.roles).toContain('admin')
  
  // Check nested object partially
  xExpect(user).toMatchObject({
    profile: {
      settings: { theme: 'dark' }
    }
  })
})
```
