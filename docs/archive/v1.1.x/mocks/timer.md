# Timer Manipulation in xJet

The timer system in xJet provides powerful capabilities for controlling time in your tests. This allows you to write deterministic tests for time-dependent code without waiting for actual time to pass.

## Overview

When testing asynchronous code that relies on timers, waiting for actual timeouts can make tests slow and brittle.
xJet's timer system lets you replace JavaScript's native timer functions (`setTimeout`, `setInterval`, etc.) with controlled,
synchronous alternatives that you can manipulate programmatically.

## Key Features

- **Fake Timers**: Replace native timer functions with controlled versions
- **Manual Time Advancement**: Move time forward without waiting
- **Timer Execution Control**: Run specific sets of timers as needed
- **Timeout Handling**: Wrap async operations with timeouts for resilience

## Timer API

### Basic Timer Functions

| Function                  | Description                                                  |
|---------------------------|--------------------------------------------------------------|
| `useFakeTimers()`         | Replaces native timers with controlled versions              |
| `useRealTimers()`         | Restores the original timer implementations                  |
| `advanceTimersByTime(ms)` | Advances simulated time by a specific amount of milliseconds |
| `runAllTimers()`          | Executes all pending timers until none remain                |
| `runOnlyPendingTimers()`  | Runs only timers that were pending when function was called  |

## Usage Examples

### Controlling Time in Tests

```ts
// Setup fake timers in your test 
beforeEach(() => { 
    xJet.useFakeTimers(); 
});

// Clean up after your test 
afterEach(() => { 
    xJet.useRealTimers(); 
});

test('calls callback after one second', () => { 
    const callback = xJet.fn();
    setTimeout(callback, 1000);
    
    // Callback has not been called yet 
    expect(callback).not.toHaveBeenCalled();
    
    // Advance time by 1000ms 
    xJet.advanceTimersByTime(1000);
    
    // Now the callback should have been called 
    expect(callback).toHaveBeenCalledTimes(1); 
});
```

### Testing Repeating Intervals

```ts
test('setInterval calls function multiple times', () => { 
    const callback = xJet.fn();
    setInterval(callback, 100);
    
    // Advance time by 500ms 
    xJet.advanceTimersByTime(500);
    
    // Callback should have been called 5 times 
    expect(callback).toHaveBeenCalledTimes(5); 
});
```

### Running All Pending Timers

```ts
test('all pending timers run in sequence', () => { 
    const log = [];
    setTimeout(() => log.push('first'), 100); 
    setTimeout(() => log.push('second'), 200);
    xJet.runAllTimers();
    expect(log).toEqual(['first', 'second']); 
});
```
