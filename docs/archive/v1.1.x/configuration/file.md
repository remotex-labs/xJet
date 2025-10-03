# Configuration File

xJet supports configuration via a config file to conveniently manage all options for test discovery,
filtering, running, reporting, and build.
This file lets you define project-wide test behavior in a reusable, versioned way.

> [!CAUTION] Configuration file
> By default, if you do not specify a config file from the CLI (with `-c` or `--config`),\
> xJet will look for `<root project>/xJet/config.xjet.ts`.

## File Structure

The configuration file should export (or set) an object.
Most CLI options can also be set here, either at the top level or inside appropriate sections.

### Example: Minimal `config.xjet.ts`

```ts
import type { xJetConfig } from '@remotex-labs/xjet';

export default {
    bail: false,
    files: [ '**/*.test.ts' ],
    timeout: 10_000,
    reporter: 'json'
} as xJetConfig;
```

### Example: Complete Configuration

```ts
import type { xJetConfig } from '@remotex-labs/xjet';

export default {
    // Which files to consider as tests
    files: ['**/*.test.ts', '**/*.spec.ts'],

    // Optionally narrow down to a subset for this suite run
    suites: ['src/unit/*.test.ts'],

    // Filter test cases or suites by name
    filter: ['should login', 'API suite'],

    // Control test execution
    bail: true,                        // Stop on first failure
    watch: false,                      // Disable watch mode
    timeout: 5000,                     // Per-test timeout (milliseconds)
    parallel: 2,                       // Run 2 files in parallel
    randomize: false,                  // Disable random execution order

    // Logging and error reporting
    logLevel: 'Info',                  // Verbosity
    verbose: false,                    // Stack trace detail
    exclude: ['**/utils.mocks.ts'],    // Files to ignore

    // Reporting
    reporter: 'junit',                 // Output format
    outputFile: 'reports/junit.xml',   // Write to this file as well as stdout

    // Build / transpilation
    build: {
        target: 'esnext',              // ECMAScript target
        external: ['react'],           // Exclude these from bundle
        platform: 'node',              // Target Node.js environment
        packages: 'external',          // Treat packages as external
    },

    // Custom CLI options (available via yargs)
    userArgv: {
        customPort: {
            type: 'number',
            describe: 'Custom port to run the test runner on',
            default: 3000,
            alias: 'p'
        },
        debug: {
            type: 'boolean',
            describe: 'Enable debug mode'
        }
    },

    // Example of a custom test runner
    testRunners: [{
        name: 'MyNodeRunner',
        connectionTimeout: 5000,
        dispatchTimeout: 5000,
        dispatch(suite, suiteId) {
            // Custom dispatch logic
        },
        connect(resolve, runnerId, argv) {
            // Custom connect logic
        },
        disconnect() {
            // Custom disconnect logic (optional)
        }
    }],
} as xJetConfig;
```

#### Passing Custom CLI Options to Runners

> [!IMPORTANT] userArgv
> Any custom CLI options defined using the `userArgv` section are automatically
> integrated into xJet's argument parser (via yargs).

When your custom runner’s `connect` method is called, the third parameter, `argv`,
contains all standard and user-defined CLI options.
This lets your runner access and respond to runtime arguments provided on
the command line without extra manual parsing.

For example, if you run:

```bash
xjet --customPort 4000 --debug
```

The `argv` object passed to `connect(resolve, runnerId, argv)` will include:

```js
const argv = {
  customPort: 4000,
  debug: true
  // ...other parsed CLI options
}
```

## Tips

- All options are optional; any settings not supplied will use their defaults.
- You can use either JavaScript or TypeScript for your config.
- Config files support full dynamic evaluation (e.g., reading environment variables).
