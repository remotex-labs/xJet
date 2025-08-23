/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { version } from 'process';

/**
 * The default settings for configuring a testing execution environment.
 *
 * @remarks
 * This configuration includes parameters such as file patterns to include/exclude,
 * timeout settings, verbosity levels, and others necessary for test orchestration.
 * These values can typically be overridden by user-defined configurations.
 *
 * @example
 * ```ts
 * import { defaultConfiguration } from './config';
 *
 * // Using default configuration with overrides
 * const config = {
 *   ...defaultConfiguration,
 *   timeout: 10000,
 *   verbose: true
 * };
 * ```
 *
 * @see ConfigurationInterface
 * @since 1.0.0
 */

export const defaultConfiguration: Partial<ConfigurationInterface> = {
    bail: false,
    files: [ '**/*.test.ts', '**/*.spec.ts' ],
    watch: false,
    silent: false,
    suites: [],
    filter: [],
    verbose: false,
    timeout: 5000,
    parallel: 10,
    exclude: [ 'node_modules' ],
    reporter: 'default',
    randomize: false,
    build: {
        target: [ `node${ version.slice(1) }` ],
        packages: 'bundle',
        platform: 'browser',
        external: []
    }
};
