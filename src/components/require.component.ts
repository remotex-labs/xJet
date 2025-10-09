/**
 * Import will remove at compile time
 */

import type { Module } from 'module';

/**
 * Module interception utility that enhances Node.js require {@link NodeJS.Require} functionality to enable mocking.
 *
 * @remarks
 * This module replaces the global `require` function with an enhanced version that:
 * - Logs all module import operations for debugging
 * - Creates shallow copies of object exports to enable property overriding
 * - Maintains original function references for direct function exports
 * - Provides a foundation for runtime module mocking and testing
 *
 * The primary purpose is to make modules mockable by ensuring that object exports
 * can be modified without affecting the original cached module, enabling test doubles
 * and dependency injection in testing environments.
 *
 * Responsibilities:
 * - Module loading tracking
 * - Export transformation for mockability
 * - Cache management
 * - Internal module protection
 *
 * @example
 * ```ts
 * // Import this module at the entry point before any other imports
 * import './require-interceptor';
 *
 * // Now you can mock modules by overriding properties
 * const fs = require('fs');
 * fs.readFileSync = jest.fn().mockReturnValue('mocked content');
 *
 * // Or you can mock getter-based modules like esbuild
 * const esbuild = require('esbuild');
 * Object.defineProperty(esbuild, 'build', {
 *   get: () => jest.fn().mockResolvedValue({ errors: [], warnings: [] })
 * });
 * ```
 *
 * @see Module
 * @see NodeJS.Require
 *
 * @since 1.2.2
 */

if(require) {
    const original = require;

    /**
     * Enhanced require function that wraps the original Node.js require to enable mocking.
     *
     * @param moduleName - The name or path of the module to require
     * @returns The exports from the required module, possibly transformed for mockability
     *
     * @remarks
     * This function intercepts all `require` calls and transforms module exports to make them
     * mockable:
     *
     * - Function exports are returned directly (can be mocked via function replacement)
     * - Object exports are shallow-cloned to enable property overriding without affecting the cache
     * - Modules with getter properties (like esbuild) can be mocked by redefining property descriptors
     * - Primitive exports are passed through unchanged
     *
     * The transformation creates a layer of indirection that allows tests to replace
     * or modify functionality without permanently altering the module cache.
     *
     * @since 1.2.2
     */

    const fn = (moduleName: string): unknown => {
        if (!original.cache[original.resolve(moduleName)]) {
            original(moduleName);
        }

        const resolved: Module & { internal?: boolean } = original.cache[original.resolve(moduleName)]!;
        if (resolved?.internal) return resolved.exports;

        let result: unknown;
        if (typeof resolved.exports === 'function') {
            result = resolved.exports;
        } else if (typeof resolved.exports === 'object' && resolved.exports !== null) {
            result = { ...resolved.exports };
        } else {
            result = resolved.exports;
        }

        if (resolved) {
            resolved.exports = result;
            resolved.internal = true;
        }

        return result;
    };

    Object.assign(fn, original);
    globalThis.require = <typeof require> fn;
}
