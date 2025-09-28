# Each

The `each` directive provides a powerful way to generate multiple test cases from data tables or argument lists,
enhancing your ability to run parameterized or data-driven tests.

## List of Arguments

Run the same test for each value provided:

```ts
test.each(1, 2, 3)('...', (value) => {
    // ...
});
```

### Tagged Template Table

Define input combinations with column headings:

```ts
describe.each` a | b | expected ${ 1 } | ${ 2 } | ${ 3 } ${ 2 } | ${ 3 } | ${ 5 }`
('%# adds $a and $b to get $expected', ({ a, b, expected }) => {
    test('calculates sum', () => {
        expect(a + b).toBe(expected);
    });
});

// OR

test.each`
    a       | b      | sum
    ${ 1 }  | ${ 2 } | ${ 3 }
    ${ 2 }  | ${ 5 } | ${ 7 }
`('adds $a + $b -> $sum', ({ a, b, sum }) => {
    expect(a + b).toBe(sum);
});

```

## Test Name Formatting

Test names support advanced formatting:

| Notation         | Meaning                                               | Example (Input)     | Example (Result/Expr) |
|------------------|-------------------------------------------------------|---------------------|-----------------------|
| `%p`             | Pretty-format output                                  | `'value: %p'`       | `'value: [1,2,3]'`    |
| `%s`             | String value                                          | `'value: %s'`       | `'value: foo'`        |
| `%d`, `%i`       | Number as integer                                     | `'id: %d'`          | `'id: 42'`            |
| `%f`             | Floating point value                                  | `'ratio: %f'`       | `'ratio: 3.14'`       |
| `%j`             | JSON string                                           | `'json: %j'`        | `'json: {"a":1}'`     |
| `%o`             | Object representation                                 | `'object: %o'`      | `'object: {}'`        |
| `%#`             | Index of the test case                                | `'case %#'`         | `'case 0'`            |
| `%%`             | Single percent sign                                   | `'percent %% done'` | `'percent % done'`    |
| `$variable`      | Inject property value (from arg object, e.g. `$name`) | `'Hi, $name!'`      | `'Hi, Jane!'`         |
| `$variable.path` | Inject nested property value (`$user.info.id`)        | `'$user.id'`        | `'42'`                |
| `$#`             | Index of the test case                                | `'row $#'`          | `'row 1'`             |

> [!CAUTION] **Note:**
>
> - `$variable`, `$variable.path`, and `$#` interpolation works only with object-based test cases.
> - `$variable` cannot be combined inside a `%` printf-format, except for `%%`.

```ts
each(test, 1, 2, 3)('test with %s', (val) => {
  expect(val).toBeGreaterThan(0);
});

test.each`name|age`(
  'John', 30,
  'Jane', 25
)('User %s is %s years old', (name, age) => {
  expect(typeof name).toBe('string');
  expect(typeof age).toBe('number');
});

test.each`
    a       | b      | sum
    ${ 1 }  | ${ 2 } | ${ 3 }
    ${ 2 }  | ${ 5 } | ${ 7 }
`('adds $a + $b -> $sum', ({ a, b, sum }) => {
    expect(a + b).toBe(sum);
});
```
