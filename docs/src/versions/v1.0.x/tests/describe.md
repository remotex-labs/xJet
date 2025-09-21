# Describe

The `describe` directive is used to define and group related tests into tests, 
providing structure, readability, and shared setup for your test specifications. 
Several variants and modifiers exist to improve your workflow:

## `describe`

Defines a group of related tests. 
This function wraps test cases under a common context.

**Example:**

```ts
describe('Calculator', () => {
    test('adds numbers', () => {
        expect(2 + 2).toBe(4);
    });
});
```

## `describe.skip`

Use `.skip` to mark an entire suite as skipped. 
Skipped suites appear in test reports but are not executed.

**Example:**

```ts
describe.skip('temporarily disabled suite', () => {
    test('will not run', () => {
        expect(true).toBe(false);
    });
});
```

## `describe.only`
Use `.only` to run only the marked suite and skip all others. 
This is especially helpful during focused development or debugging.

**Example:**

```ts
describe.only('run only this suite', () => {
    test('important case', () => {
        expect(true).toBe(true);
    });
});
```

> [!CAUTION] 
> If you mark more than one `describe` or test with `.only`, **all of them will be run** and all others will be skipped.

### How `.only` Works

- Marking a `describe.only` or `test.only` tells the runner to execute only those suites/tests, skipping all others not marked with `.only`.
- If **multiple** suites or tests are marked with `.only`, each of them will be executed (not just one).
- This is useful for focusing on several related areas without running the entire test set.

### Child Tests Inheritance

When you apply `.only` to a `describe` block, **all child tests and nested describes inside it are included** for execution. If you nest `describe.only` inside another describe, only the path(s) with `.only` marker(s) will be run.

### Example

```ts
describe('users', () => {
    describe.only('admins', () => {
        test('admin-only feature', () => {
        })
    });
    describe('guests', () => {
        test('guest-only feature', () => {
        })
    });
});
describe.only('products', () => {
    test('product listing', () => {
    })
});
```

In the example above:
- Both the `admins` and `products` suites (and all their inner tests) will be run.
- The `guests` suite and its tests will be skipped.

## `describe.each`

Creates parameterized/templated test suites. 
This variant enables you to automatically repeat suites or specs with different input data, 
improving coverage and reducing repetition.

You can use both arrays and template tables as shown below:

**Array Example:**

```ts
describe.each(1, 2, 3)('%# Square of', value => {
    test('is positive', () => {
        expect(value * value).toBeGreaterThan(0);
    });
});
```

**Template Table Example:**

```ts
describe.each` a | b | expected ${ 1 } | ${ 2 } | ${ 3 } ${ 2 } | ${ 3 } | ${ 5 }`
('%# adds $a and $b to get $expected', ({ a, b, expected }) => {
    test('calculates sum', () => {
        expect(a + b).toBe(expected);
    });
});

// OR

describe.each` 
    a      | b      | expected 
    ${ 1 } | ${ 2 } | ${ 3 } 
    ${ 2 } | ${ 3 } | ${ 5 }`
('%# adds $a and $b to get $expected', ({ a, b, expected }) => {
    test('calculates sum', () => {
        expect(a + b).toBe(expected);
    });
});
```

> See the [tests/each](/tests/each) section for more advanced usage, options, and best practices on parameterized test suites.

## Summary

- **`describe`**: Group and organize related tests.
- **`describe.skip`**: Temporarily exclude a suite from runs.
- **`describe.only`**: Focus on a single suite.
- **`describe.each`**: Generate repetitive/parameterized suites for data-driven testing.

Use these tools to structure large test suites, increase maintainability, and streamline your testing workflow.
