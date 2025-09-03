/**
 * Import will remove at compile time
 */

import type { CliOptionsInterface } from '@providers/interfaces/cli-provider.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { existsSync } from 'fs';
import { defaultConfiguration } from '@configuration/default.configuration';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Loads and merges the xJet configuration.
 *
 * @param configFile - Optional path to a user configuration file (e.g., 'xjet.config.ts').
 * @param cli - Command-line options provided by the user.
 * @returns A promise that resolves to the final {@link ConfigurationInterface} object.
 *
 * @remarks
 * This function performs the following steps:
 * 1. Starts with the default configuration.
 * 2. If a configuration file is provided and exists, it is parsed using {@link parseConfigurationFile}.
 * 3. The user configuration is merged with the default configuration. The `exclude` arrays from both
 *    configurations are concatenated to preserve all exclusions.
 * 4. Finally, command-line options override any existing configuration values.
 *
 * This ensures that defaults, user configuration, and CLI flags are combined consistently,
 * giving priority to CLI arguments.
 *
 * @example
 * ```ts
 * import { configuration } from '@services/configuration.service';
 *
 * const cliOptions = { watch: true, verbose: true };
 * const config = await configuration('xjet.config.ts', cliOptions);
 * console.log(config);
 * ```
 *
 * @see parseConfigurationFile
 * @see ConfigurationInterface
 *
 * @since 1.0.0
 */

export async function configuration(configFile: string = '', cli: CliOptionsInterface): Promise<ConfigurationInterface> {
    let config = { ...defaultConfiguration };
    if (configFile && existsSync(configFile)) {
        const userConfig = await parseConfigurationFile(configFile);
        if (userConfig) {
            config = {
                ...config,
                ...userConfig,
                exclude: [ ...(config.exclude ?? []), ...(userConfig.exclude ?? []) ]
            };
        }
    }

    return <ConfigurationInterface> { ...config, ...cli };
}
