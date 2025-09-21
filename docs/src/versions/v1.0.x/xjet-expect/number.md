# Number Matchers
Number matchers allow you to perform numeric comparisons in your tests, validating that values satisfy specific relationships.

## toBeCloseTo
Checks if a number is approximately equal to an expected value within a specified precision.

```ts
expect(value).toBeCloseTo(expected, precision?)
```

This matcher is especially useful for floating-point arithmetic where exact equality can be problematic due to rounding errors.
## Parameters
- `expected`: The target number to compare against
- : (Optional) The number of decimal places to check, defaults to 2 `precision`

### Examples
```ts
// Basic floating point comparison
expect(0.1 + 0.2).toBeCloseTo(0.3)  // Passes (default precision: 2)

// With custom precision
expect(0.1234).toBeCloseTo(0.123, 3)  // Passes
expect(0.1234).not.toBeCloseTo(0.123, 4)  // Passes

// Negative numbers
expect(-1.23).toBeCloseTo(-1.2, 1)  // Passes
```

### How It Works
The matcher calculates an allowed difference based on the precision:
- Tolerance = 10^(-precision) / 2
- Comparison: |actual - expected| < tolerance

## toBeGreaterThan
Checks if a number is greater than the expected value.

```ts
expect(value).toBeGreaterThan(expected)
```

### Examples
```ts
expect(10).toBeGreaterThan(5)  // Passes
expect(5).toBeGreaterThan(5)  // Fails
expect(-1).toBeGreaterThan(-2)  // Passes

// Works with any comparable values
expect('b').toBeGreaterThan('a')  // Passes (string comparison)
expect(new Date(2023, 1, 1)).toBeGreaterThan(new Date(2022, 1, 1))  // Passes
```

## toBeGreaterThanOrEqual
Checks if a number is greater than or equal to the expected value.

```ts
expect(value).toBeGreaterThanOrEqual(expected)
```

### Examples
```ts
expect(10).toBeGreaterThanOrEqual(10)  // Passes
expect(10).toBeGreaterThanOrEqual(5)  // Passes
expect(5).toBeGreaterThanOrEqual(10)  // Fails
```
