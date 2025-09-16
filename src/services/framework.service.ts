/**
 * Imports
 */

import url from 'url';
import { dirname } from 'path';
import { normalize } from 'path';
import { readFileSync } from 'fs';
import { Injectable } from '@symlinks/services/inject.service';
import { type PositionInterface, SourceService } from '@remotex-labs/xmap';

/**
 * Provides access to the framework's file paths and associated source maps.
 *
 * @remarks
 * This service manages the framework's source map files, including the main framework
 * file and any additional source files. It caches initialized {@link SourceService}
 * instances for performance.
 *
 * @example
 * ```ts
 * const frameworkService = new FrameworkService();
 * console.log(frameworkService.rootPath);
 * const sourceMap = frameworkService.sourceMap(frameworkService.filePath);
 * ```
 *
 * @since 1.0.0
 */

@Injectable({
    scope: 'singleton'
})
export class FrameworkService {
    /**
     * Absolute path to the current file.
     * @readonly
     *
     * @since 1.0.0
     */

    readonly filePath: string;

    /**
     * Absolute path to the distribution directory.
     * @readonly
     *
     * @since 1.0.0
     */

    readonly distPath: string;

    /**
     * Absolute path to the project root directory.
     * @readonly
     *
     * @since 1.0.0
     */

    readonly rootPath: string;

    /**
     * Source service for the main framework file.
     * @readonly
     *
     * @see SourceService
     * @since 1.0.0
     */

    readonly frameworkSourceMap: SourceService;

    /**
     * Cached {@link SourceService} instances for additional source files.
     * @since 1.0.0
     */

    private readonly sourceMaps = new Map<string, SourceService>();

    /**
     * Initializes a new {@link FrameworkService} instance.
     *
     * @remarks
     * Sets up the main framework source map, as well as root and distribution paths.
     *
     * @since 1.0.0
     */

    constructor() {
        this.filePath = url.fileURLToPath(import.meta.url);
        this.setSourceFile(this.filePath);
        this.frameworkSourceMap = this.getSourceMap(this.filePath)!;

        this.rootPath = this.getRootDir();
        this.distPath = this.getDistDir();
    }

    /**
     * Determines whether a given {@link PositionInterface} refers to a framework file.
     *
     * @param position - The position information to check
     * @returns `true` if the position is from the framework (contains "xJet"), otherwise `false`
     *
     * @see PositionInterface
     * @since 1.0.0
     */

    isFrameworkFile(position: PositionInterface): boolean {
        const { source, sourceRoot } = position;
        const lowerCaseSource = source?.toLowerCase();

        return Boolean(
            (source && lowerCaseSource.includes('xjet') && !lowerCaseSource.includes('xjet.config')) ||
            (sourceRoot && sourceRoot.includes('xJet'))
        );
    }

    /**
     * Retrieves a cached {@link SourceService} for a given file path.
     *
     * @param path - Absolute path to the file
     * @returns A {@link SourceService} instance if found, otherwise `undefined`
     *
     * @remarks
     * Paths are normalized before lookup. Only previously initialized source maps
     * (via {@link setSource} or {@link setSourceFile}) are available in the cache.
     *
     * @see SourceService
     * @since 1.0.0
     */

    getSourceMap(path: string): SourceService | undefined {
        path = normalize(path);
        if (this.sourceMaps.has(path))
            return this.sourceMaps.get(path)!;

        return undefined;
    }

    /**
     * Registers and initializes a new {@link SourceService} for a provided source map string.
     *
     * @param source - The raw source map content
     * @param path - Absolute file path associated with the source map
     * @returns A new or cached {@link SourceService} instance
     *
     * @throws Error if initialization fails
     *
     * @remarks
     * If a source map for the given path is already cached, the cached instance is returned.
     *
     * @see SourceService
     * @since 1.0.0
     */

    setSource(source: string, path: string): void {
        const key = normalize(path);

        try {
            return this.initializeSourceMap(source, key);
        } catch (error) {
            throw new Error(
                `Failed to initialize SourceService: ${ key }\n${ error instanceof Error ? error.message : String(error) }`
            );
        }
    }

    /**
     * Loads and initializes a {@link SourceService} for a file and its `.map` companion.
     *
     * @param path - Absolute path to the file
     * @returns A new or cached {@link SourceService} instance
     *
     * @throws Error if the `.map` file cannot be read or parsed
     *
     * @remarks
     * This method attempts to read the `.map` file located next to the provided file.
     * If already cached, returns the existing {@link SourceService}.
     *
     * @see SourceService
     * @since 1.0.0
     */

    setSourceFile(path: string): void {
        const key = normalize(path);
        const map = `${ path }.map`;

        if (this.sourceMaps.has(key))
            return;

        try {
            const sourceMapData = readFileSync(map, 'utf-8');

            return this.initializeSourceMap(sourceMapData, key);
        } catch (error) {
            throw new Error(
                `Failed to initialize SourceService: ${ key }\n${ error instanceof Error ? error.message : String(error) }`
            );
        }
    }

    /**
     * Retrieves the project root directory.
     * @returns Absolute path to the project root
     *
     * @since 1.0.0
     */

    private getRootDir(): string {
        return process.cwd();
    }

    /**
     * Retrieves the distribution directory.
     * @returns Absolute path to the distribution folder
     *
     * @since 1.0.0
     */

    private getDistDir(): string {
        return dirname(this.filePath);
    }

    /**
     * Creates and caches a new {@link SourceService} instance for a given source map.
     *
     * @param source - Raw source map content
     * @param key - Normalized file path used as the cache key
     * @returns The newly created {@link SourceService} instance
     *
     * @remarks
     * This method is only used internally by {@link setSource} and {@link setSourceFile}.
     * The instance is cached in {@link sourceMaps} for reuse.
     *
     * @see SourceService
     * @since 1.0.0
     */

    private initializeSourceMap(source: string, key: string): void {
        if(source?.includes('"mappings": ""'))
            return;

        const sourceMap = new SourceService(source, this.filePath);
        this.sourceMaps.set(key, sourceMap);
    }
}
