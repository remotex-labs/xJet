# Test Suite Lifecycle Hooks in xJet

Lifecycle hooks allow you to run code at different stages of a test suite:

- **beforeAll**: Runs once before all tests in the current test suite.
- **afterAll**: Runs once after all tests in the current test suite.
- **beforeEach**: Runs before each test in the suite.
- **afterEach**: Runs after each test in the suite.

Each hook can handle synchronous actions, Promises/async functions, 
or code using a callback (the classic “done” pattern).

## Inheritance and Execution Order

xJet hooks are **inherited down the describe tree**, and **executed in a defined parent-to-child (root-to-leaf) order**:

- **beforeAll**: Runs once per describe block, before any tests or nested describes within that block begin. If you nest describes, every relevant `beforeAll` hook (from the root outward) is called, in order.
- **beforeEach**: Runs before every test, cascading from root-most to leaf-most describe (outermost parent first, innermost child last).
- **afterEach**: Runs after every test, cascading from innermost child to outermost parent (leaf to root).
- **afterAll**: Runs once per describe block, after all tests and nested describes have finished, from innermost child describe to the outermost parent (leaf to root).

### Example

```ts
beforeEach(() => console.log('root'));
describe('A', () => {
    beforeAll(() => console.log('A beforeAll'));
    beforeEach(() => console.log('A beforeEach'));
    describe('B', () => {
        beforeAll(() => console.log('B beforeAll'));
        beforeEach(() => console.log('B beforeEach'));
        test('my test', () => console.log('test'));
    });
});
```

```text
A beforeAll
B beforeAll
root
A beforeEach
B beforeEach
test
```

## Hook Function Styles and Timeouts

Every lifecycle hook can be provided in one of several forms:

- **Synchronous** (just a function, no `done`, no `async`)
- **With Timeout** (second argument specifies max time in milliseconds)
- **Async** (returns a Promise or marked as `async`)
- **Callback style** (`done` parameter; call `done()` on completion)

You can combine these forms, for example, specifying a timeout for an async or callback-style hook.

```ts
beforeAll(() => { /* Synchronous setup code here */ });
beforeAll(() => { /* Synchronous with timeout; this function must complete in 5000ms */ }, 5000);
beforeAll(async () => { /* Async code with automatic waiting for Promise resolution */ });
beforeAll((done) => { /* Callback-based, call done() when finished setTimeout(done, 100); */ });
```

## Key Points

- Hooks in parent describes affect all their children.
- `beforeAll` and `beforeEach` hooks always run in parent-to-child order (root-to-leaf).
- `afterEach` and `afterAll` hooks run in child-to-parent order (leaf-to-root).
- This guarantees that setup and teardown flow is predictable for all your nested and composed test structures.
