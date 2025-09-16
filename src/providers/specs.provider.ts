/**
 * Import will remove at compile time
 */

import type { Dirent } from '@humanfs/node';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { join, relative } from 'path';
import { existsSync, readdirSync } from 'fs';
import { inject } from '@symlinks/symlinks.module';
import { FrameworkService } from '@services/framework.service';
import { compilePatterns, matchesAny } from '@components/glob.component';

/**
 * Computes the relative path of a file from the project root.
 *
 * @param path - The full absolute path of the file.
 * @returns The file path relative to the root.
 *
 * @since 1.0.0
 */

export function getRelativePath(path: string): string {
    return relative(inject(FrameworkService).rootPath, path);
}

/**
 * Recursively collects test files from a directory matching include patterns and not matching exclude patterns.
 *
 * @param dir - Directory to scan.
 * @param patterns - Regex patterns for files to include.
 * @param excludes - Regex patterns for files to exclude.
 * @param suites - Regex patterns for test suites to include (temp suite filter).
 * @param specFiles - Optional accumulator for collected files.
 * @returns A map of relative file paths to absolute paths.
 *
 * @remarks
 * This function traverses the directory tree, skips excluded paths early, and collects files that
 * match both suite and file patterns. The `FrameworkService` is used to compute relative paths.
 *
 * @since 1.0.0
 */

export function collectFilesFromDir(
    dir: string, patterns: Array<RegExp>, excludes: Array<RegExp>, suites: Array<RegExp>, specFiles: Record<string, string> = {}
): Record<string, string> {
    if (!existsSync(dir)) return {};
    const entries: Array<Dirent> = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = getRelativePath(fullPath);

        if (matchesAny(relativePath, excludes))
            continue;

        if (entry.isDirectory()) {
            collectFilesFromDir(fullPath, patterns, excludes, suites, specFiles);
            continue;
        }

        const allowSuite = suites.length === 0 || matchesAny(relativePath, suites);
        if (allowSuite && matchesAny(fullPath, patterns)) {
            const relativeFilePath = relativePath;
            const key = relativeFilePath.replace(/\.[^/.]+$/, '');

            specFiles[key] = relativeFilePath;
        }
    }

    return specFiles;
}

/**
 * Retrieves all test files from a directory based on the provided configuration and suite filters.
 *
 * @param dir - Root directory to scan for test files.
 * @param config - Configuration object containing `files` and `exclude` patterns.
 * @returns A map of relative file paths to absolute paths.
 *
 * @remarks
 * This function compiles configuration patterns into regular expressions and delegates
 * a file collection to {@link collectFilesFromDir}.
 * It supports filtering by:
 * - **files** → which files to include
 * - **exclude** → which files or directories to skip
 * - **suites** → optional suite-specific filters;
 *
 * @example
 * ```ts
 * const specFiles = getSpecFiles('/project/tests', config, [/unit/]);
 * console.log(specFiles);
 * // { 'unit/test1.spec.ts': '/project/tests/unit/test1.spec.ts', ... }
 * ```
 *
 * @see collectFilesFromDir
 * @since 1.0.0
 */

export function getSpecFiles(dir: string, config: ConfigurationInterface): Record<string, string> {
    const suitesRegex = compilePatterns(config?.suites ?? []);
    const patternsRegex = compilePatterns(config?.files ?? []);
    const excludesRegex = compilePatterns(config?.exclude ?? []);

    return collectFilesFromDir(dir, patternsRegex, excludesRegex, suitesRegex);
}
