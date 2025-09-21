# xJet Logging Utilities

`xJet` provides a suite of logging functions designed for use during test runtime. 
These functions let you send logs, errors, warnings, 
or debug output directly to the test runner or reporting layer, 
making it easy to trace, debug, and communicate test state from inside any test or helper.

## API

The following logging methods are available:

- `xJet.log(...args)`
- `xJet.info(...args)`
- `xJet.warn(...args)`
- `xJet.error(...args)`
- `xJet.debug(...args)`

All functions accept any number of arguments of any type (just like `console.log`) and forward those to the runner/logger.

```ts
xJet.debug('User:', userId, 'Request:', requestDetails);
```

## Output

Error:

![Error](/images/error.png)

Debug:

![Debug](/images/debug.png)

## Summary Table

| Function          | Purpose                                  | Example Usage                                      |
|-------------------|------------------------------------------|----------------------------------------------------|
| `xJet.log`        | General-purpose logging                  | `xJet.log('Test message', obj)`                    |
| `xJet.info`       | Informational events                     | `xJet.info('Current state:', state)`               |
| `xJet.warn`       | Potential problems or warnings           | `xJet.warn('Threshold exceeded:', value)`          |
| `xJet.error`      | Errors or failed operations              | `xJet.error('Exception:', error)`                  |
| `xJet.debug`      | Detailed debug information               | `xJet.debug('Params:', params)`                    |

