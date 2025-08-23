/**
 * Imports
 */

import { compileGlobPattern, compilePatterns, isGlob, matchesAny } from '@components/glob.component';

/**
 * Tests
 */

describe('isGlob', () => {
    test('should return true for basic glob patterns', () => {
        expect(isGlob('*.js')).toBe(true);
        expect(isGlob('src/**/*.ts')).toBe(true);
        expect(isGlob('file-?.txt')).toBe(true);
    });

    test('should return true for brace patterns', () => {
        expect(isGlob('{a,b}.js')).toBe(true);
        expect(isGlob('src/{foo,bar}/*.js')).toBe(true);
    });

    test('should return true for character class patterns', () => {
        expect(isGlob('[abc].js')).toBe(true);
        expect(isGlob('src/[0-9]*.ts')).toBe(true);
    });

    test('should return true for extglob patterns', () => {
        expect(isGlob('@(pattern).js')).toBe(true);
        expect(isGlob('+(foo|bar).ts')).toBe(true);
    });

    test('should return false for regular file paths', () => {
        expect(isGlob('file.js')).toBe(false);
        expect(isGlob('src/components/Button.tsx')).toBe(false);
        expect(isGlob('path/to/file.txt')).toBe(false);
        expect(isGlob('C:\\Users\\admin\\GoogleDrive\\Desktop\\main\\src\\test2.spec.ts')).toBe(false);
    });
});

describe('matchesAny', () => {
    test('should return true when path matches one of the patterns', () => {
        const path = 'src/file.ts';
        const patterns = [ /\.ts$/, /\.js$/ ];

        expect(matchesAny(path, patterns)).toBe(true);
    });

    test('should return false when path does not match any pattern', () => {
        const path = 'src/file.css';
        const patterns = [ /\.ts$/, /\.js$/ ];

        expect(matchesAny(path, patterns)).toBe(false);
    });

    test('should return true when path matches the only pattern', () => {
        const path = 'src/file.ts';
        const patterns = [ /\.ts$/ ];

        expect(matchesAny(path, patterns)).toBe(true);
    });

    test('should return false for empty patterns array', () => {
        const path = 'src/file.ts';
        const patterns: RegExp[] = [];

        expect(matchesAny(path, patterns)).toBe(false);
    });

    test('should match directory paths correctly', () => {
        const path = 'node_modules/package';
        const patterns = [ /^node_modules\// ];

        expect(matchesAny(path, patterns)).toBe(true);
    });

    test('should handle complex regex patterns', () => {
        const path = 'src/components/Button.test.tsx';
        const patterns = [ /^src\/.*\.test\.(ts|tsx)$/ ];

        expect(matchesAny(path, patterns)).toBe(true);
    });
});

describe('compileGlobPattern', () => {
    test('should correctly match simple wildcards', () => {
        const regex = compileGlobPattern('*.js');
        expect(regex.test('file.js')).toBe(true);
        expect(regex.test('test.js')).toBe(true);
        expect(regex.test('file.ts')).toBe(false);
        expect(regex.test('folder/file.js')).toBe(false);
    });

    test('should handle double asterisk (recursive matching)', () => {
        const regex = compileGlobPattern('src/**/test.js');
        expect(regex.test('src/test.js')).toBe(true);
        expect(regex.test('src/foo/test.js')).toBe(true);
        expect(regex.test('src/foo/bar/test.js')).toBe(true);
        expect(regex.test('src/test.ts')).toBe(false);
    });

    test('should handle question marks', () => {
        const regex = compileGlobPattern('file-?.js');
        expect(regex.test('file-1.js')).toBe(true);
        expect(regex.test('file-a.js')).toBe(true);
        expect(regex.test('file-ab.js')).toBe(false);
    });

    test('should handle brace expansion', () => {
        const regex = compileGlobPattern('src/{foo,bar}.js');
        expect(regex.test('src/foo.js')).toBe(true);
        expect(regex.test('src/bar.js')).toBe(true);
        expect(regex.test('src/baz.js')).toBe(false);
    });

    test('should handle character classes', () => {
        const regex = compileGlobPattern('file-[abc].js');
        expect(regex.test('file-a.js')).toBe(true);
        expect(regex.test('file-b.js')).toBe(true);
        expect(regex.test('file-c.js')).toBe(true);
        expect(regex.test('file-d.js')).toBe(false);
    });

    test('should handle complex patterns', () => {
        const regex = compileGlobPattern('src/**/{test,spec}.[jt]s');
        expect(regex.test('src/test.js')).toBe(true);
        expect(regex.test('src/test.ts')).toBe(true);
        expect(regex.test('src/foo/test.js')).toBe(true);
        expect(regex.test('src/foo/spec.ts')).toBe(true);
        expect(regex.test('src/foo/file.js')).toBe(false);
    });

    test('should escape special regex characters', () => {
        const regex = compileGlobPattern('file+name.js');
        expect(regex.test('file+name.js')).toBe(true);
        expect(regex.test('filename.js')).toBe(false);
    });

    test('should handle file extensions with dots', () => {
        const regex = compileGlobPattern('*.min.js');
        expect(regex.test('file.min.js')).toBe(true);
        expect(regex.test('file.js')).toBe(false);
    });

    test('should correctly match simple wildcards', () => {
        const regex = compileGlobPattern('*.js');
        expect(regex.test('file.js')).toBe(true);
        expect(regex.test('test.js')).toBe(true);
        expect(regex.test('file.ts')).toBe(false);
        expect(regex.test('folder/file.js')).toBe(false);
    });

    test('should handle double asterisk (recursive matching)', () => {
        const regex = compileGlobPattern('src/**/test.js');
        expect(regex.test('src/test.js')).toBe(true);
        expect(regex.test('src/foo/test.js')).toBe(true);
        expect(regex.test('src/foo/bar/test.js')).toBe(true);
        expect(regex.test('src/test.ts')).toBe(false);
    });

    test('should handle question marks', () => {
        const regex = compileGlobPattern('file-?.js');
        expect(regex.test('file-1.js')).toBe(true);
        expect(regex.test('file-a.js')).toBe(true);
        expect(regex.test('file-ab.js')).toBe(false);
    });

    test('should handle brace expansion', () => {
        const regex = compileGlobPattern('src/{foo,bar}.js');
        expect(regex.test('src/foo.js')).toBe(true);
        expect(regex.test('src/bar.js')).toBe(true);
        expect(regex.test('src/baz.js')).toBe(false);
    });

    test('should handle character classes', () => {
        const regex = compileGlobPattern('file-[abc].js');
        expect(regex.test('file-a.js')).toBe(true);
        expect(regex.test('file-b.js')).toBe(true);
        expect(regex.test('file-c.js')).toBe(true);
        expect(regex.test('file-d.js')).toBe(false);
    });

    test('should handle complex patterns', () => {
        const regex = compileGlobPattern('src/**/{test,spec}.[jt]s');
        expect(regex.test('src/test.js')).toBe(true);
        expect(regex.test('src/test.ts')).toBe(true);
        expect(regex.test('src/foo/test.js')).toBe(true);
        expect(regex.test('src/foo/spec.ts')).toBe(true);
        expect(regex.test('src/foo/file.js')).toBe(false);
    });

    test('should escape special regex characters', () => {
        const regex = compileGlobPattern('file+name.js');
        expect(regex.test('file+name.js')).toBe(true);
        expect(regex.test('filename.js')).toBe(false);
    });

    test('should handle file extensions with dots', () => {
        const regex = compileGlobPattern('*.min.js');
        expect(regex.test('file.min.js')).toBe(true);
        expect(regex.test('file.js')).toBe(false);
    });
});

describe('glob', () => {
    test('should match single wildcard patterns', () => {
        const patterns = compilePatterns([ '*.txt' ]);
        expect(matchesAny('file.txt', patterns)).toBe(true);
        expect(matchesAny('test.txt', patterns)).toBe(true);
        expect(matchesAny('file.jpg', patterns)).toBe(false);
        expect(matchesAny('path/file.txt', patterns)).toBe(false);
    });

    test('should match double asterisk patterns for directories', () => {
        const patterns = compilePatterns([ '**/test.txt' ]);
        expect(matchesAny('test.txt', patterns)).toBe(true);
        expect(matchesAny('dir/test.txt', patterns)).toBe(true);
        expect(matchesAny('dir/sub-dir/test.txt', patterns)).toBe(true);
        expect(matchesAny('test.jpg', patterns)).toBe(false);
    });

    test('should match patterns with middle directory wildcards', () => {
        const patterns = compilePatterns([ 'src/**/test.txt' ]);
        expect(matchesAny('src/test.txt', patterns)).toBe(true);
        expect(matchesAny('src/dir/test.txt', patterns)).toBe(true);
        expect(matchesAny('src/dir/sub-dir/test.txt', patterns)).toBe(true);
        expect(matchesAny('other/test.txt', patterns)).toBe(false);
    });

    test('should match multiple patterns', () => {
        const patterns = compilePatterns([ '*.txt', '*.md' ]);
        expect(matchesAny('file.txt', patterns)).toBe(true);
        expect(matchesAny('readme.md', patterns)).toBe(true);
        expect(matchesAny('image.png', patterns)).toBe(false);
    });

    test('should match patterns with question marks', () => {
        const patterns = compilePatterns([ 'test.???' ]);
        expect(matchesAny('test.txt', patterns)).toBe(true);
        expect(matchesAny('test.doc', patterns)).toBe(true);
        expect(matchesAny('test.jpeg', patterns)).toBe(false);
    });

    test('should match patterns with character sets', () => {
        const patterns = compilePatterns([ 'file[0-9].txt' ]);
        expect(matchesAny('file1.txt', patterns)).toBe(true);
        expect(matchesAny('file5.txt', patterns)).toBe(true);
        expect(matchesAny('filea.txt', patterns)).toBe(false);
    });

    test('should match patterns with negated character sets', () => {
        const patterns = compilePatterns([ 'file[^0-9].txt' ]);
        expect(matchesAny('filea.txt', patterns)).toBe(true);
        expect(matchesAny('file1.txt', patterns)).toBe(false);
    });

    test('should match patterns with braces', () => {
        const patterns = compilePatterns([ '*.{jpg,png}' ]);
        expect(matchesAny('image.jpg', patterns)).toBe(true);
        expect(matchesAny('image.png', patterns)).toBe(true);
        expect(matchesAny('image.gif', patterns)).toBe(false);
    });

    test('should handle RegExp patterns directly', () => {
        const patterns = compilePatterns([ /^test\d+\.txt$/ ]);
        expect(matchesAny('test123.txt', patterns)).toBe(true);
        expect(matchesAny('test.txt', patterns)).toBe(false);
    });

    test('should match complex nested patterns', () => {
        const patterns = compilePatterns([ 'src/**/test/*.{js,ts}' ]);
        expect(matchesAny('src/test/file.js', patterns)).toBe(true);
        expect(matchesAny('src/deep/test/file.ts', patterns)).toBe(true);
        expect(matchesAny('src/test/file.css', patterns)).toBe(false);
        expect(matchesAny('other/test/file.js', patterns)).toBe(false);
    });

    test('should match patterns with multiple double asterisks', () => {
        const patterns = compilePatterns([ '**/*.test.{js,ts}' ]);
        expect(matchesAny('file.test.js', patterns)).toBe(true);
        expect(matchesAny('src/file.test.ts', patterns)).toBe(true);
        expect(matchesAny('src/nested/deep/file.test.js', patterns)).toBe(true);
        expect(matchesAny('file.js', patterns)).toBe(false);
    });

    test('should handle empty patterns array', () => {
        expect(matchesAny('file.txt', [])).toBe(false);
    });

    test('should handle mixed string and RegExp patterns', () => {
        const patterns = compilePatterns([ '*.txt', /^test\d+\.js$/ ]);
        expect(matchesAny('file.txt', patterns)).toBe(true);
        expect(matchesAny('test123.js', patterns)).toBe(true);
        expect(matchesAny('other.js', patterns)).toBe(false);
    });
});
