/**
 * Imports
 */

import { relative } from 'path';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import { inject } from '@symlinks/symlinks.module';
import { FrameworkService } from '@services/framework.service';

/**
 * A map storing TypeScript path aliases.
 *
 * @remarks
 * The keys are the alias patterns (with '*' removed), and the values are
 * the corresponding target paths (also with '*' removed).
 *
 * @example
 * ```ts
 * typescriptAlias.set('@app/', 'src/app/');
 * ```
 */

export const typescriptAlias = new Map<string, string>();

/**
 * Updates the `typescriptAlias` map based on a `tsconfig.json` file.
 *
 * @param tsconfigPath - The path to the TypeScript configuration file.
 *                      Defaults to `'tsconfig.json'`.
 *
 * @remarks
 * Reads the `compilerOptions.paths` section and populates the alias map.
 * Only the first path in each entry is used, and any trailing '*' are removed.
 *
 * @example
 * ```ts
 * updateAliases(); // Uses default 'tsconfig.json'
 * updateAliases('configs/tsconfig.app.json'); // Custom path
 * ```
 */

export function updateAliases(tsconfigPath: string = 'tsconfig.json'): void {
    const raw = readFileSync(tsconfigPath, 'utf8');
    const json = JSON.parse(raw);
    const paths = json.compilerOptions?.paths;

    if (!paths) return;

    for (const [ key, value ] of Object.entries(paths)) {
        if (Array.isArray(value) && value.length > 0) {
            typescriptAlias.set(key.replace('*', ''), value[0].replace('*', ''));
        }
    }
}

/**
 * Resolves an import path to its relative path from the framework root.
 *
 * @param importPath - The import path to resolve.
 *
 * @returns The resolved relative path if found, otherwise `undefined`.
 *
 * @remarks
 * This function first checks the `typescriptAlias` map for a matching pattern.
 * If none is found, it attempts to resolve the module using Node's `require.resolve`.
 * The returned path is always relative to the framework's root path.
 *
 * @example
 * ```ts
 * const resolved = resolveImport('@app/utils');
 * // might return 'src/app/utils.ts' relative to framework root
 * ```
 */

export function resolveImport(importPath: string): string | undefined {
    const framework = inject(FrameworkService);
    for (const [ pattern, target ] of typescriptAlias.entries()) {
        if (importPath.includes(pattern)) {
            const resolved = importPath.replace(pattern, target);

            return relative(framework.rootPath, resolved);
        }
    }

    try {
        const require = createRequire(pathToFileURL(framework.rootPath + '/__placeholder__.js').href);
        const path = require.resolve(importPath);
        if(path) return relative(framework.rootPath, path);
    } catch {
        return;
    }
}
