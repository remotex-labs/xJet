/**
 * Imports
 */

import { existsSync } from 'fs';
import { configuration } from '@providers/configuration.provider';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Mock dependencies
 */

jest.mock('fs');
jest.mock('@configuration/parse.configuration');
jest.mock('@configuration/default.configuration', () => ({
    defaultConfiguration: {
        option1: 'default1',
        option2: 'default2'
    }
}));

/**
 * Tests
 */

describe('configuration', () => {
    // A mock implementation of the `parseConfigurationFile` function, used for testing purposes.
    const parser = <jest.Mock> <unknown> parseConfigurationFile;

    // Mock default configuration that would be imported in the actual file
    const baseConfiguration = {
        option1: 'default1',
        option2: 'default2'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the mock implementation for existsSync
        (existsSync as jest.Mock).mockReset();
        parser.mockReset();
        parser.mockReturnValue(baseConfiguration);
    });

    test('should return default configuration when no config file and no CLI options provided', async () => {
        const cliOptions = {};
        const result = await configuration('', <any> cliOptions);

        expect(result).toEqual(baseConfiguration);
        expect(existsSync).not.toHaveBeenCalled();
        expect(parseConfigurationFile).not.toHaveBeenCalled();
    });

    test('should merge user config with default configuration when config file exists', async () => {
        const configFile = 'config.js';
        const cliOptions = {};
        const userConfig = {
            option2: 'userValue2',
            option3: 'userValue3'
        };

        (existsSync as jest.Mock).mockReturnValue(true);
        (parseConfigurationFile as jest.Mock).mockResolvedValue(userConfig);

        const result = await configuration(configFile, <any> cliOptions);

        expect(result).toEqual({
            exclude: [],
            option1: 'default1',
            option2: 'userValue2',
            option3: 'userValue3'
        });
        expect(existsSync).toHaveBeenCalledWith(configFile);
        expect(parseConfigurationFile).toHaveBeenCalledWith(configFile);
    });

    test('should prioritize CLI options over user and default config', async () => {
        const configFile = 'config.js';
        const cliOptions = {
            option2: 'cliValue2',
            option4: 'cliValue4'
        };
        const userConfig = {
            option1: 'userValue1',
            option2: 'userValue2',
            option3: 'userValue3'
        };

        (existsSync as jest.Mock).mockReturnValue(true);
        (parseConfigurationFile as jest.Mock).mockResolvedValue(userConfig);

        const result = await configuration(configFile, <any> cliOptions);

        expect(result).toEqual({
            exclude: [],
            option1: 'userValue1',
            option2: 'cliValue2',
            option3: 'userValue3',
            option4: 'cliValue4'
        });
    });

    test('should not parse config file if it does not exist', async () => {
        const configFile = 'nonexistent.js';
        const cliOptions = {};

        (existsSync as jest.Mock).mockReturnValue(false);

        const result = await configuration(configFile, <any> cliOptions);

        expect(result).toEqual(baseConfiguration);
        expect(existsSync).toHaveBeenCalledWith(configFile);
        expect(parseConfigurationFile).not.toHaveBeenCalled();
    });

    test('should handle empty user config gracefully', async () => {
        const configFile = 'config.js';
        const cliOptions = {};

        (existsSync as jest.Mock).mockReturnValue(true);
        (parseConfigurationFile as jest.Mock).mockResolvedValue(null);

        const result = await configuration(configFile, <any> cliOptions);

        expect(result).toEqual(baseConfiguration);
        expect(parseConfigurationFile).toHaveBeenCalledWith(configFile);
    });
});
