/**
 * Imports
 */

import { defineVersionedConfig } from '@viteplus/versions';

/**
 * Doc config
 */

export default defineVersionedConfig({
    root: 'docs',
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
            { text: 'Home', link: '/' },
            {
                component: 'VersionSwitcher'
            }
        ],

        sidebar: {
            '/': [
                { text: 'Guide', link: '/' },
                { text: 'Log', link: '/log' },
                {
                    text: 'Configuration',
                    collapsed: false,
                    items: [
                        { text: 'CLI Options', link: '/configuration/cli' },
                        { text: 'Configuration File', link: '/configuration/file' }
                    ]
                },
                {
                    text: 'Test files',
                    collapsed: false,
                    items: [
                        { text: 'Each', link: '/tests/each' },
                        { text: 'Tests', link: '/tests/test' },
                        { text: 'Hooks', link: '/tests/hooks' },
                        { text: 'Describe', link: '/tests/describe' }
                    ]
                },
                {
                    text: 'Mocks',
                    collapsed: false,
                    items: [
                        { text: 'Spy', link: '/mocks/spy' },
                        { text: 'Mock', link: '/mocks/mock' },
                        { text: 'Function', link: '/mocks/fn' }
                    ]
                },
                {
                    text: 'Advanced',
                    collapsed: false,
                    items: [{ text: 'External Runners', link: '/configuration/external-runners' }]
                },
                {
                    text: 'Matchers',
                    collapsed: false,
                    items: [
                        { text: 'Mock', link: '/xjet-expect/mock' },
                        { text: 'Number', link: '/xjet-expect/number' },
                        { text: 'Object', link: '/xjet-expect/object' },
                        { text: 'String', link: '/xjet-expect/string' },
                        { text: 'Equality', link: '/xjet-expect/equality' },
                        { text: 'Functions', link: '/xjet-expect/functions' }
                    ]
                }
            ]
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
        latestVersion: 'v1.1.x'
    }
});
