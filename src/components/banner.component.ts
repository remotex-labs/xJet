/**
 * Imports
 */

import { xterm } from '@remotex-labs/xansi/xterm.component';

/**
 * ASCII art logo for the framework.
 *
 * @remarks
 * This logo is styled using {@link xterm} color utilities when displayed
 * via the {@link bannerComponent}.
 *
 * @example
 * ```ts
 * console.log(asciiLogo);
 * ```
 *
 * @since 1.0.0
 */

export const asciiLogo = `
        ___      _
       |_  |    | |
__  __   | | ___| |_
\\ \\/ /   | |/ _ \\ __|
 >  </\\__/ /  __/ |_
/_/\\_\\____/ \\___|\\__|
`;

/**
 * Creates a colored ASCII banner including the framework version.
 *
 * @remarks
 * Uses {@link xterm} to render the ASCII logo and
 * {@link xterm} to highlight the `__VERSION` string.
 *
 * @returns A formatted string suitable for console output
 *
 * @example
 * ```ts
 * console.log(bannerComponent());
 * ```
 *
 * @see asciiLogo
 * @since 1.0.0
 */

export function bannerComponent(): string {
    return `${ xterm.burntOrange(asciiLogo) }\nVersion: ${ xterm.brightPink(__VERSION) }\n`;
}
