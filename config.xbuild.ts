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

export const config: xBuildConfig = {
    common: {
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
            sourceRoot: `https://github.com/remotex-lab/xJet/tree/v${ pkg.version }/`
        }
    },
    variants: {
        bash: {
            declaration: false,
            define: {
                __VERSION: pkg.version
            },
            esbuild: {
                entryPoints: {
                    'bash': 'src/bash.ts'
                }
            }
        },
        index: {
            esbuild: {
                packages: 'bundle',
                entryPoints: {
                    'index': 'src/index.ts'
                }
            }
        },
        shared: {
            esbuild: {
                minify: false,
                minifySyntax: true,
                minifyWhitespace: true,
                minifyIdentifiers: false,
                entryPoints: {
                    'shared': 'src/modules/shared/shared.module.ts'
                }
            }
        }
    }
};
