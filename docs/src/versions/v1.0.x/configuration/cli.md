# CLI Configuration

The xJet test runner supports a comprehensive set of CLI options for test discovery, 
execution, and reporting. Below is a guide to each available option, 
which can be provided as command-line flags or specified via your configuration file.

## Configuration Precedence

> [!IMPORTANT]
> **When a CLI flag and a value in the configuration file specify different values for the same option, the CLI flag always takes precedence.**

- **Example:**
  If your configuration file contains: `"reporter": "json"`


and you run:

```bash
  xjet --reporter spec
```

Then the CLI will use the `"spec"` reporter, overriding the JSON reporter defined in your configuration file.
This allows you to easily override defaults or shared settings from your configuration file for particular runs, 
without modifying the file itself.

## Common CLI Options

| Option         | Type                                                           | Description                                                                                          |
|----------------|----------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| `--bail`       | `boolean`                                                      | Stop running tests after the first failure.                                                          |
| `--watch`      | `boolean`                                                      | Watch files for changes and re-run tests automatically.                                              |
| `--config`     | `string`                                                       | Path to xJet configuration file (`.ts` or `.js`) [default: "xJet/config.xjet.ts"]                    |
| `--files`      | `array<string/RegExp>`                                         | Glob patterns or file paths to discover test files. e.g., `--files "**/*.test.ts" "src/foo.test.js"` |
| `--suites`     | `array<string>`                                                | Subset of files or globs selected from `--files` to run.                                             |
| `--filter`     | `array<string>`                                                | List of test or suite names to execute.                                                              |
| `--logLevel`   | `string` (`Error`, `Info`, `Trace`, `Debug`, `Silent`, `Warn`) | Set logging verbosity.                                                                               |
| `--timeout`    | `number` (ms)                                                  | Per-test timeout in milliseconds.                                                                    |
| `--verbose`    | `boolean`                                                      | Show full stack traces (internal and native frames) in errors.                                       |
| `--reporter`   | `string` (`spec`, `json`, `junit`, `PATH`)                     | Test reporter to use, built-in or custom file path.                                                  |
| `--parallel`   | `number`                                                       | Number of test files to run in parallel.                                                             |
| `--randomize`  | `boolean`                                                      | Randomize the order of test execution.                                                               |
| `--outputFile` | `string`                                                       | Write reporter output to this file as well as stdout.                                                |

> [!CAUTION] Watch mode
> :rocket: When enabled, watch mode will only re-run tests that are related to changes made in your project source files.


## Usage Examples

**Running all tests with the default reporter:**

```bash
xjet --files "**/*.test.ts"
```

or 

```bash
xjet "**/*.test.ts"
```

**Run only specific suites:**

```bash
xjet --files "**/*.test.ts" --suites "tests/unit/*.test.ts"
```

**Use the JUnit reporter and write output to a file:**

```bash
xjet --reporter junit --outputFile reports/junit.xml
```

**Watch for changes and run in parallel:**

```bash
xjet --watch --parallel 4
```

## Filtering and Selection

- **files**: Discover test files with globs or paths.
- **suites**: Further restrict files to those matching listed paths or globs.
- **filter**: Restrict tests by suite/test name (matched by string).

## Additional Notes

- Boolean options can be negated using `--no-<option>` (e.g., `--no-watch`).
- Custom user arguments are supported and can be defined—see the related configuration file documentation for details.
- For custom reporters or test runners, use file paths or npm module names as appropriate.
