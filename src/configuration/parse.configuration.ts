/**
 * Import will remove at compile time
 */

import type { BuildOptions } from 'esbuild';
import type { ModuleInterface } from '@remotex-labs/xbuild';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { dirname } from 'path';
import { createRequire } from 'module';
import { sandboxExecute } from '@services/vm.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';

/**
 * Parses and executes a JavaScript configuration file in a secure sandbox.
 *
 * @param file - The path to the configuration file (e.g., 'xjet.config.js').
 * @returns A promise that resolves to the exported configuration object.
 *
 * @remarks
 * This function performs the following steps:
 * 1. Transpiles the provided configuration file using esbuild with Node.js
 *    compatible settings and without minification.
 * 2. Executes the transpiled code in a sandboxed environment using `sandboxExecute`.
 *    Only a controlled set of globals (Error, Buffer, RegExp, require, console,
 *    setTimeout, setInterval, and a module object) are exposed.
 * 3. Captures any errors thrown during execution and wraps them in a {@link VMRuntimeError}.
 * 4. Returns the exported configuration object from the module. If no default export
 *    is found, it returns an empty object.
 *
 * @throws VMRuntimeError - If an error occurs during sandbox execution.
 *
 * @example
 * ```ts
 * import { parseConfigurationFile } from '@services/configuration-parser';
 *
 * const config = await parseConfigurationFile('xjet.config.js');
 * console.log(config);
 * ```
 *
 * @see transpileFile
 * @see sandboxExecute
 * @see VMRuntimeError
 *
 * @since 1.0.0
 */

export async function parseConfigurationFile(file: string): Promise<ConfigurationInterface> {
    const transpileOptions: BuildOptions = {
        minify: false,
        format: 'cjs',
        outdir: dirname(file),
        platform: 'node',
        logLevel: 'silent',
        packages: 'external',
        minifySyntax: true,
        preserveSymlinks: true,
        minifyWhitespace: true,
        minifyIdentifiers: false
    };

    const module: ModuleInterface = { exports: {} };
    const { code, path } = await transpileFile(file, transpileOptions);
    const require = createRequire(path);

    try {
        await sandboxExecute(code, {
            Error,
            module,
            Buffer,
            RegExp,
            require,
            console,
            setTimeout,
            setInterval
        }, { filename: path });
    } catch (error: unknown) {
        if(error instanceof Error)
            throw new VMRuntimeError(<Error> error);

        throw error;
    }

    return <ConfigurationInterface> (module.exports.default ?? {});
}
