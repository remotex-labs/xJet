/**
 * Imports
 */

import { xterm } from '@remotex-labs/xansi/xterm.component';
import { asciiLogo, bannerComponent } from '@components/banner.component';


/**
 * Mocks
 */

jest.mock('@remotex-labs/xansi/xterm.component', () => ({
    xterm: {
        burntOrange: jest.fn((input: string) => `burntOrange(${ input })`),
        brightPink: jest.fn((input: string) => `brightPink(${ input })`)
    }
}));

// Mock global __VERSION
(global as any).__VERSION = '1.2.3';

/**
 * Tests
 */

describe('bannerComponent', () => {
    test('should format ASCII logo with burntOrange', () => {
        const banner = bannerComponent();
        expect(xterm.burntOrange).toHaveBeenCalledWith(asciiLogo);
        expect(banner).toContain(`burntOrange(${ asciiLogo })`);
    });

    test('should format version with brightPink', () => {
        const banner = bannerComponent();
        expect(xterm.brightPink).toHaveBeenCalledWith('1.2.3');
        expect(banner).toContain('brightPink(1.2.3)');
    });

    test('should return a formatted string with logo and version', () => {
        const banner = bannerComponent();
        expect(banner).toMatch(/burntOrange\([\s\S]+\)\nVersion: brightPink\(1\.2\.3\)\n/);
    });
});
