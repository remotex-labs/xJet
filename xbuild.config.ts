/**
 * Import will remove at compile time
 */

import type { xBuildConfig } from '@remotex-labs/xbuild';

/**
 * Imports
 */

import { version } from 'process';
import pkg from './package.json' with { type: 'json' };

/**
 * Config build
 */

const config: Array<xBuildConfig> = [
    {
        bundleDeclaration: false,
        define: {
            __VERSION: pkg.version
        },
        esbuild: {
            bundle: true,
            minify: true,
            target: [ `node${ version.slice(1) }` ],
            outdir: 'dist',
            format: 'esm',
            platform: 'node',
            packages: 'external',
            keepNames: true,
            sourcemap: 'linked',
            sourceRoot: `https://github.com/remotex-lab/xJet/tree/v${ pkg.version }/`,
            entryPoints: {
                'bash': 'src/bash.ts'
            }
        }
    },
    {
        bundleDeclaration: true,
        esbuild: {
            bundle: true,
            minify: true,
            target: [ `node${ version.slice(1) }` ],
            outdir: 'dist',
            format: 'esm',
            packages: 'bundle',
            sourcemap: 'linked',
            entryPoints: {
                'index': 'src/index.ts'
            }
        }
    },
    {
        bundleDeclaration: true,
        esbuild: {
            bundle: true,
            minify: true,
            target: [ `node${ version.slice(1) }` ],
            outdir: 'dist',
            format: 'esm',
            packages: 'bundle',
            sourcemap: 'linked',
            entryPoints: {
                'shared': 'src/modules/shared/shared.module.ts'
            }
        }
    }
];

export default config;
