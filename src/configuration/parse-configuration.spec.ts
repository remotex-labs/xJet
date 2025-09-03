/**
 * Imports
 */

import { sandboxExecute } from '@services/vm.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Mock dependencies
 */

jest.mock('@symlinks/services/inject.service', () => ({
    inject: jest.fn(() => ({
        getSourceMap: jest.fn(() => undefined)
    }))
}));

jest.mock('@services/framework.service', () => {
    return {
        FrameworkService: jest.fn().mockImplementation(() => ({
            setSource: jest.fn(),
            getSourceMap: jest.fn(),
            isFrameworkFile: jest.fn()
        }))
    };
});

jest.mock('@services/transpiler.service', () => ({
    transpileFile: jest.fn()
}));

jest.mock('@services/vm.service', () => ({
    sandboxExecute: jest.fn()
}));

/**
 * Tests
 */

describe('parseConfigurationFile', () => {
    const mockCode = 'module.exports.default = { key: "value" };';
    const mockPath = '/path/to/config.js';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should transpile and execute the configuration file', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({ code: mockCode, path: mockPath });
        (sandboxExecute as jest.Mock).mockImplementation(async (code, context) => {
            context.module.exports.default = { key: 'value' };
        });

        const result = await parseConfigurationFile('xjet.config.js');

        expect(transpileFile).toHaveBeenCalledWith('xjet.config.js', expect.objectContaining({
            minify: false,
            platform: 'node'
        }));

        expect(sandboxExecute).toHaveBeenCalledWith(
            mockCode,
            expect.objectContaining({
                Error: expect.any(Function),
                module: expect.any(Object),
                Buffer: expect.any(Function),
                RegExp: expect.any(Function),
                require: expect.any(Function),
                console: expect.any(Object),
                setTimeout: expect.any(Function),
                setInterval: expect.any(Function)
            }),
            { filename: mockPath }
        );

        expect(result).toEqual({ key: 'value' });
    });

    test('should return empty object if module.exports.default is missing', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({ code: 'module.exports = {}', path: mockPath });
        (sandboxExecute as jest.Mock).mockImplementation((code, context) => {
            // Simulate executing code that assigns nothing to default
            context.module.exports = {};
        });

        const result = await parseConfigurationFile('xjet.config.js');
        expect(result).toEqual({});
    });

    test('should throw VMRuntimeError if sandbox execution throws', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({ code: mockCode, path: mockPath });
        (sandboxExecute as jest.Mock).mockImplementation(async () => {
            throw new Error('Execution failed');
        });

        await expect(parseConfigurationFile('xjet.config.js')).rejects.toBeInstanceOf(VMRuntimeError);
    });

    test('should rethrow non-Error exceptions', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({ code: mockCode, path: mockPath });
        const nonError = 'string error';
        (sandboxExecute as jest.Mock).mockRejectedValue(nonError);

        await expect(parseConfigurationFile('xjet.config.js')).rejects.toBe(nonError);
    });
});
