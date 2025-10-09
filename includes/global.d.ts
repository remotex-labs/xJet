/**
 * Globals
 */

declare global {
    /**
     * TypeScript declaration for Node.js require function in browser and Node.js environments.
     *
     * @remarks
     * This declaration allows TypeScript to recognize the global `require` function
     * which may be present in Node.js environments but not in browsers.
     * The union type `undefined | NodeJS.Require` enables code to:
     *
     * 1. Check if `require` exists before using it
     * 2. Access proper TypeScript typings for the require function when available
     * 3. Support both Node.js and browser environments with the same codebase
     *
     * In browser environments, `require` will be `undefined`, while in Node.js
     * it will have the full `NodeJS.Require` interface with properties like
     * `require.cache` and methods like `require.resolve`.
     *
     * @example
     * ```ts
     * // Safe usage with type checking
     * if (require) {
     *   const fs = require('fs');
     *   // Use Node.js modules safely
     * } else {
     *   // Browser fallback logic
     * }
     * ```
     *
     * @see NodeJS.Require - The full require interface from @types/node
     * @since 1.2.2
     */

    declare var require: undefined | NodeJS.Require;

    /**
     * Environment variable flag that indicates if color output should be disabled.
     *
     * @default undefined
     *
     * @remarks
     * When set to true, this constant signals that ANSI color codes should not be used
     * in terminal output. This follows the NO_COLOR standard (https://no-color.org/)
     * for respecting user preferences about colored output.
     *
     * Applications should check this value before generating colored terminal output
     * and disable colors when it's set to true.
     *
     * @see https://no-color.org/ - The NO_COLOR standard specification
     *
     * @since 1.0.0
     */

    declare var NO_COLOR: true | undefined;

    /**
     * If true, include both xJet internal and native stack traces in error output.
     *
     * @remarks
     * - When `false`, stack traces are minimized to user code only.
     * - When `true`, full stack traces are printed, including internal frames.
     *
     * @since 1.0.0
     */

    declare var VERBOSE: boolean;

    /**
     * Package version
     */

    declare const __VERSION: string;

    /**
     * Dispatch message result from the test runner
     */

    declare function dispatch(data: Buffer): void;

    /**
     * Global type declarations for xJet runtime.
     *
     * @remarks
     * The `__XJET` namespace provides runtime identifiers used internally by xJet.
     *
     * @since 1.0.0
     */

    namespace __XJET {
        /**
         * Import will remove at compile time
         */

        import type { RuntimeConfigInterface } from '@targets/interfaces/traget.interface';

        /**
         * Runtime information
         */

        declare const runtime: RuntimeConfigInterface;
    }
}

export {};
