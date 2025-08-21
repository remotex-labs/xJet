/**
 * Imports
 */

import { dirname, normalize } from 'path';
import { readFileSync } from 'fs';
import { SourceService } from '@remotex-labs/xmap';
import { FrameworkService } from '@services/framework.service';

/**
 * Mock dependencies
 */

jest.mock('fs', () => ({
    readFileSync: jest.fn()
}));

jest.mock('@remotex-labs/xmap', () => ({
    SourceService: jest.fn().mockImplementation((data, path) => ({ data, path }))
}));

/**
 * Tests
 */

describe('FrameworkService', () => {
    let frameworkService: FrameworkService;

    beforeEach(() => {
        (readFileSync as jest.Mock).mockReturnValue('mock source map');
        (SourceService as jest.Mock).mockClear();
        frameworkService = new FrameworkService();
    });

    test('should initialize filePath, rootPath, and distPath', () => {
        expect(frameworkService.filePath).toContain('framework.service');
        expect(frameworkService.rootPath).toBe(process.cwd());
        expect(frameworkService.distPath).toBe(dirname(frameworkService.filePath));
    });

    test('should initialize frameworkSourceMap on construction', () => {
        expect(SourceService).toHaveBeenCalledWith('mock source map', frameworkService.filePath);
        expect(frameworkService.frameworkSourceMap).toBeDefined();
    });

    test('should return frameworkSourceMap when calling getSourceMap(filePath)', () => {
        const map = frameworkService.getSourceMap(frameworkService.filePath);
        expect(map).toBe(frameworkService.frameworkSourceMap);
    });

    test('should return undefined for unknown file in getSourceMap', () => {
        const map = frameworkService.getSourceMap('/not/cached.js');
        expect(map).toBeUndefined();
    });

    test('should cache SourceService when calling setSource', () => {
        const fakePath = '/some/file.js';
        const result1 = frameworkService.setSource('source map text', fakePath);
        const result2 = frameworkService.setSource('different data', fakePath);

        expect(result1).toBe(result2); // same cached instance
        expect(SourceService).toHaveBeenCalledWith('source map text', frameworkService.filePath);
    });

    test('should cache SourceService when calling setSourceFile', () => {
        const fakePath = '/another/file.js';
        const map1 = frameworkService.setSourceFile(fakePath);
        const map2 = frameworkService.setSourceFile(fakePath);

        expect(map1).toBe(map2);
        expect(readFileSync).toHaveBeenCalledWith(`${ fakePath }.map`, 'utf-8');
    });

    test('should throw error if setSourceFile fails to read', () => {
        (readFileSync as jest.Mock).mockImplementationOnce(() => {});
        (readFileSync as jest.Mock).mockImplementationOnce(() => {
            throw new Error('file not found');
        });

        const badService = new FrameworkService(); // constructor already calls setSourceFile
        expect(() => badService.setSourceFile('/bad/path.js')).toThrow(
            new RegExp(`Failed to initialize SourceService: ${
                normalize('/bad/path.js').replace(/\\/g, '\\\\')
            }\nfile not found`)
        );
    });

    test('isFrameworkFile should return true if source or sourceRoot contains "xJet"', () => {
        expect(frameworkService.isFrameworkFile({ source: 'some/xJet/file.js' } as any)).toBe(true);
        expect(frameworkService.isFrameworkFile({ sourceRoot: '/root/xJet/' } as any)).toBe(true);
    });

    test('isFrameworkFile should return false otherwise', () => {
        expect(frameworkService.isFrameworkFile({ source: 'some/other/file.js' } as any)).toBe(false);
        expect(frameworkService.isFrameworkFile({} as any)).toBe(false);
    });
});
