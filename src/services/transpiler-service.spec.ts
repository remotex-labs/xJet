/**
 * Imports
 */

import { build } from 'esbuild';
import { inject } from '@symlinks/services/inject.service';
import { buildFiles, transpileFile, transpileFiles } from '@services/transpiler.service';

/**
 * Mock dependencies
 */

jest.mock('esbuild', () => ({
    build: jest.fn()
}));

jest.mock('@errors/esbuild.error', () => ({
    esBuildError: jest.fn((err) => err)
}));

jest.mock('@errors/xjet.error', () => ({
    xJetError: jest.fn((msg) => ({ message: msg }))
}));

jest.mock('@symlinks/services/inject.service', () => ({
    inject: jest.fn(),
    Injectable: jest.fn()
}));

/**
 * Tests
 */

describe('ESBuild helpers', () => {
    const mockFramework = { setSource: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (inject as jest.Mock).mockReturnValue(mockFramework);
    });

    describe('buildFiles', () => {
        test('should call esbuild.build with merged options and return result', async () => {
            const mockResult = { outputFiles: [{ path: 'a.js', text: 'code' }] };
            (build as jest.Mock).mockResolvedValue(mockResult);

            const result = await buildFiles([ 'entry.ts' ], { minify: false });

            expect(build).toHaveBeenCalled();
            expect(result).toBe(mockResult);
        });

        test('should throw esBuildError on esbuild failure', async () => {
            const error = new Error('fail');
            (build as jest.Mock).mockRejectedValue(error);

            await expect(buildFiles([ 'entry.ts' ])).rejects.toBe(error);
        });
    });

    describe('transpileFiles', () => {
        test('should transpile JS files and register source maps', async () => {
            const mockBuildResult = {
                outputFiles: [
                    { path: 'a.js', text: 'code1' },
                    { path: 'a.js.map', text: 'map1' }
                ]
            };
            (build as jest.Mock).mockResolvedValue(mockBuildResult);

            const result = await transpileFiles([ 'entry.ts' ]);

            expect(mockFramework.setSource).toHaveBeenCalledWith('map1', 'a.js');
            expect(result).toEqual([{ path: 'a.js', code: 'code1//# sourceURL=a.js' }]);
        });
    });

    describe('transpileFile', () => {
        test('should return first transpiled file', async () => {
            const mockBuildResult = {
                outputFiles: [{ path: 'a.js', text: 'code1' }]
            };
            (build as jest.Mock).mockResolvedValue(mockBuildResult);

            const result = await transpileFile('entry.ts');
            expect(result).toEqual({ path: 'a.js', code: 'code1//# sourceURL=a.js' });
        });

        test('should throw xJetError if no output generated', async () => {
            (build as jest.Mock).mockResolvedValue({ outputFiles: [] });

            await expect(transpileFile('entry.ts')).rejects.toEqual(
                expect.objectContaining({ message: 'Failed to transpile file: No output generated' })
            );
        });
    });
});
