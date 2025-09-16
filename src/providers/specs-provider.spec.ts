/**
 * Imports
 */

import { collectFilesFromDir, getSpecFiles, getRelativePath } from './specs.provider';

/**
 * Mock dependencies
 */

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readdirSync: jest.fn()
}));

jest.mock('path', () => ({
    join: jest.fn((...parts: string[]) => parts.join('/')),
    relative: jest.fn((from: string, to: string) => to.replace(from + '/', ''))
}));

jest.mock('@symlinks/symlinks.module', () => ({
    inject: jest.fn(() => ({ rootPath: '/root' }))
}));

jest.mock('@components/glob.component', () => {
    const originalModule = jest.requireActual('@components/glob.component');

    return {
        ...originalModule,
        compilePatterns: jest.fn((patterns: string[]) => patterns.map(p => new RegExp(p)))
    };
});

jest.mock('@symlinks/services/inject.service', () => ({
    Injectable: jest.fn(),
    inject: jest.fn(() => ({
        rootPath: 'root',
        getSourceMap: jest.fn(() => undefined)
    }))
}));

const { existsSync, readdirSync } = jest.requireMock('fs');
const { inject } = jest.requireMock('@symlinks/symlinks.module');

/**
 * Helpers
 */

function createDirent(name: string, isDir = false) {
    return {
        name,
        isDirectory: () => isDir
    } as any;
}

/**
 * Tests
 */

describe('file collection utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (inject as jest.Mock).mockReturnValue({ rootPath: '/root' });
    });

    describe('getRelativePath', () => {
        test('should call path.relative', () => {
            const result = getRelativePath('/root/abc/test.js');
            expect(result).toBe('abc/test.js');
        });
    });

    describe('collectFilesFromDir', () => {
        test('should return empty object if dir does not exist', () => {
            (existsSync as jest.Mock).mockReturnValue(false);

            const result = collectFilesFromDir('/missing', [], [], [], {});
            expect(result).toEqual({});
        });

        test('should recursively collect matching files', () => {
            (existsSync as jest.Mock).mockReturnValue(true);
            (readdirSync as jest.Mock).mockReturnValueOnce([
                createDirent('sub', true),
                createDirent('a.test.js')
            ]);

            (readdirSync as jest.Mock).mockReturnValueOnce([ createDirent('b.spec.js') ]);

            const result = collectFilesFromDir(
                '/root',
                [ /\.test\.js$/, /\.spec\.js$/ ],
                [],
                [],
                {}
            );

            expect(result).toEqual({
                'a.test': 'a.test.js',
                'sub/b.spec': 'sub/b.spec.js'
            });
        });

        test('should skip excluded files', () => {
            (existsSync as jest.Mock).mockReturnValue(true);
            (readdirSync as jest.Mock).mockReturnValue([ createDirent('skip.js') ]);

            // exclude should match
            const result = collectFilesFromDir(
                '/root',
                [ /\.js$/ ],
                [ /skip/ ],
                [],
                {}
            );

            expect(result).toEqual({});
        });

        test('should only include files if they match suites filter', () => {
            (existsSync as jest.Mock).mockReturnValue(true);
            (readdirSync as jest.Mock).mockReturnValue([ createDirent('only.js') ]);

            const result = collectFilesFromDir(
                '/root',
                [ /\.js$/ ],
                [],
                [ /only/ ],
                {}
            );

            expect(result).toEqual({ 'only': 'only.js' });
        });
    });

    describe('getSpecFiles', () => {
        beforeEach(() => {
            (inject as jest.Mock).mockReturnValue({ rootPath: '/root' });
            jest.clearAllMocks();
        });

        test('should compile patterns and return matching files', () => {
            const config = {
                files: [ '\\.test\\.js$' ],
                exclude: [ 'node_modules' ],
                suites: []
            };

            // Mock fs
            (existsSync as jest.Mock).mockReturnValue(true);
            (readdirSync as jest.Mock).mockImplementation((dir: string) => {
                if (dir === '/root') {
                    return [
                        { name: 'file1.test.js', isDirectory: () => false },
                        { name: 'file2.js', isDirectory: () => false },
                        { name: 'subdir', isDirectory: () => true }
                    ];
                }
                if (dir === '/root/subdir') {
                    return [{ name: 'file3.test.js', isDirectory: () => false }];
                }

                return [];
            });

            const result = getSpecFiles('/root', config as any);
            expect(Object.keys(result).sort()).toEqual([
                'file1.test',
                'subdir/file3.test'
            ]);
        });
    });
});
