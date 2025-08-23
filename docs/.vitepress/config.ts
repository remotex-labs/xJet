/**
 * Import will remove at compile time
 */

import type { UserConfig } from 'vitepress';

/**
 * Imports
 */

import { join } from 'path';
import defineVersionedConfig from 'vitepress-versioning-plugin';

/**
 * Doc config
 */

export default defineVersionedConfig({
    title: 'xJet',
    base: '/xJet/',
    srcDir: 'src',
    description: 'A versatile JavaScript and TypeScript toolchain build system',
    head: [
        [ 'link', { rel: 'icon', type: 'image/png', href: '/xJet/xjet3.png' }],
        [ 'meta', { name: 'theme-color', content: '#ff7e17' }],
        [ 'script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-LZ4KRNH629' }],
        [
            'script', {},
            'window.dataLayer = window.dataLayer || [];function gtag(){ dataLayer.push(arguments); }gtag(\'js\', new Date());gtag(\'config\', \'G-LZ4KRNH629\');'
        ]
    ],
    themeConfig: {
        logo: '/xjet3.png',
        versionSwitcher: false,

        search: {
            provider: 'local'
        },

        nav: [
            { text: 'Home', link: '.' },
            {
                component: 'VersionSwitcher'
            }
        ],

        sidebar: {
            '/': [{ text: 'Guide', link: '.' }]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/remotex-labs/xJet' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/@remotex-labs/xjet' }
        ],

        docFooter: {
            prev: false,
            next: false
        }
    },
    versioning: {
        latestVersion: 'v1.0.x'
    }
}, join(__dirname, '../src', 'versions')) as UserConfig;
