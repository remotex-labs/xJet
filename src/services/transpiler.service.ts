/**
 * Import will remove at compile time
 */

import type { BuildOptions, BuildResult, Metafile } from 'esbuild';
import type { ESBuildErrorInterface } from '@errors/interfaces/esbuild-error.interface';
import type { TranspileFileInterface, TranspileFileType } from '@services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { build } from 'esbuild';
import { xJetError } from '@errors/xjet.error';
import { esBuildError } from '@errors/esbuild.error';
import { inject } from '@symlinks/services/inject.service';
import { FrameworkService } from '@services/framework.service';

/**
 * Default ESBuild options used when building or transpiling files.
 *
 * @remarks
 * These defaults bundle, minify, preserve symlinks, and generate external sourcemaps
 * targeting modern browser environments.
 *
 * see BuildOptions
 * @since 1.0.0
 */

export const defaultBuildOptions: BuildOptions = {
    write: false,
    bundle: true,
    minify: true,
    outdir: `${ cwd() }`,
    format: 'esm',
    target: 'esnext',
    platform: 'browser',
    sourcemap: 'external',
    mangleQuoted: true,
    sourcesContent: true,
    preserveSymlinks: true
};

/**
 * Builds multiple files using ESBuild with specified options.
 *
 * @param filePaths - Array of entry points to build
 * @param buildOptions - Optional override build options
 *
 * @returns A promise resolving to an ESBuild BuildResult including metafile information
 *
 * @throws esBuildError - Thrown if ESBuild encounters errors during build
 *
 * @remarks
 * This function merges user-provided options with default options and ensures
 * that a metafile is generated. If any errors occur during the build, they are
 * wrapped in a {@link esBuildError} for consistent error reporting.
 *
 * @example
 * ```ts
 * const result = await buildFiles(['src/index.ts'], { minify: false });
 * console.log(result.outputFiles);
 * ```
 *
 * @see esBuildError
 * @since 1.0.0
 */

export async function buildFiles(filePaths: BuildOptions['entryPoints'], buildOptions: BuildOptions = {}): Promise<BuildResult<BuildOptions & Metafile>> {
    try {
        return await build({
            absWorkingDir: cwd(),
            ...defaultBuildOptions,
            ...buildOptions,
            metafile: true,
            entryPoints: filePaths
        }) as BuildResult<BuildOptions & Metafile>;
    } catch (esbuildErrors) {
        throw new esBuildError(<ESBuildErrorInterface> esbuildErrors);
    }
}

/**
 * Transpiles multiple files and returns their output code and paths.
 *
 * @param filePaths - Array of files to transpile
 * @param buildOptions - Optional override ESBuild options
 *
 * @returns A promise resolving to an array of transpiled files with paths and code
 *
 * @remarks
 * Output files ending with `.js.map` are registered with the {@link FrameworkService}.
 * Only `.js` files are returned in the result array for further processing.
 *
 * @example
 * ```ts
 * const transpiled = await transpileFiles(['src/index.ts']);
 * console.log(transpiled[0].path, transpiled[0].code);
 * ```
 *
 * @see buildFiles
 * @see FrameworkService
 *
 * @since 1.0.0
 */

export async function transpileFiles(filePaths: BuildOptions['entryPoints'], buildOptions: BuildOptions = {}): Promise<TranspileFileType> {
    const result = await buildFiles(filePaths, buildOptions);

    const transpiled: TranspileFileType = [];
    const outputFiles = result.outputFiles ?? [];
    const framework = inject(FrameworkService);

    for (const file of outputFiles) {
        const basePath = file.path.replace(/\.(map)$/, '');
        const isSourceMap = file.path.endsWith('.js.map');
        const isJsFile = file.path.endsWith('.js');

        if (isSourceMap) {
            framework.setSource(file.text, basePath);
        } else if (isJsFile) {
            transpiled.push({
                path: basePath,
                code: file.text + `//# sourceURL=${ basePath }`
            });
        }
    }

    return transpiled;
}

/**
 * Transpiles a single file and returns its output code and path.
 *
 * @param filePath - The path of the file to transpile
 * @param buildOptions - Optional override ESBuild options
 *
 * @returns A promise resolving to a single transpiled file object
 *
 * @throws xJetError - Thrown if no output is generated for the file
 *
 * @remarks
 * Internally calls {@link transpileFiles} with a single-element array and returns
 * the first result. Ensures consistent error reporting if the transpilation fails.
 *
 * @example
 * ```ts
 * const file = await transpileFile('src/index.ts');
 * console.log(file.path, file.code);
 * ```
 *
 * @see xJetError
 * @see transpileFiles
 *
 * @since 1.0.0
 */

export async function transpileFile(filePath: string, buildOptions: BuildOptions = {}): Promise<TranspileFileInterface> {
    const files = await transpileFiles([ filePath ], buildOptions);
    const result = files.shift();
    if (!result) {
        throw new xJetError('Failed to transpile file: No output generated');
    }

    return result;
}
