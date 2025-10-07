/**
 * Import will remove at compile time
 */

import type { DeepSearchInterface } from '@shared/components/interfaces/object.interface';

/**
 * Recursively searches for a specific element within an object or its nested properties.
 *
 * @param target - The object to search within.
 * @param element - The value to find within the target object or its nested properties.
 * @param key - Optional specific key to search for within the target object.
 * @param maxDepth - Maximum recursion depth to prevent infinite loops, defaults to 3.
 * @returns A {@link DeepSearchInterface} object containing parent and key if found, or null if not found.
 *
 * @remarks
 * This utility performs a depth-first search through an object's properties to locate a specific value
 * or a property with a specific key. It maintains a set of visited objects to prevent circular reference issues.
 *
 * The search process:
 * - Tracks visited objects to avoid circular references
 * - Searches by exact reference equality for the element
 * - Handles errors during property access
 * - Limits search depth to prevent stack overflow
 * - Can find elements by exact key name (when the `key` parameter is provided)
 *
 * @example
 * ```ts
 * const obj = {
 *   a: 1,
 *   b: {
 *     c: 'test',
 *     d: [1, 2, { e: 'target' }]
 *   }
 * };
 *
 * // Find by value
 * const result = deepSearchObject(obj, 'target');
 * // result: { parent: { e: 'target' }, key: 'e' }
 *
 * // Find by key name
 * const byKey = deepSearchObject(obj, null, 'c');
 * // byKey: { parent: { c: 'test', d: [...] }, key: 'c' }
 * ```
 *
 * @see DeepSearchInterface
 * @since 1.0.0
 */

export function deepSearchObject(
    target: Record<string | symbol, unknown>, element: unknown, key?: string, maxDepth: number = 3
): DeepSearchInterface | null {
    const visited = new WeakSet<object>();

    function search(target: Record<string | symbol, unknown>, depth: number): DeepSearchInterface | null {
        if (depth > maxDepth || target == null || (typeof target !== 'object' && typeof target !== 'function')) return null;
        if (visited.has(target)) return null;
        visited.add(target);

        if (key && key in target) return { parent: target, key };
        for (const [ prop, value ] of Object.entries(target)) {
            if (Object.is(value, element)) return { parent: target, key: prop };
            if (value && (typeof value === 'object' || typeof value === 'function')) {
                const found = search(value as Record<string | symbol, unknown>, depth + 1);
                if (found) return found;
            }
        }

        return null;
    }

    return search(target, 0);
}

/**
 * Resolves property references that may be affected by ESBuild's `__toESM` transformation.
 *
 * @remarks
 * This function handles a specific issue with ESBuild's module transformation where Node.js
 * built-in modules (like 'fs', 'http', etc.) are wrapped with getter descriptors that aren't
 * configurable. This causes problems when trying to mock or modify these modules in testing.
 *
 * When ESBuild transforms CommonJS modules to ESM, it creates non-configurable getter properties
 * on the module object. This function detects such cases and returns a reference to the original
 * underlying object instead, making the property accessible for mocking or modification.
 *
 * @param parent - The object containing the property to resolve
 * @param key - The property name or symbol to resolve
 * @returns A {@link DeepSearchInterface} pointing to either the original object or the
 *          underlying object in case of non-configurable ESBuild transformations
 *
 * @example
 * ```ts
 * // When working with an ESBuild transformed fs module
 * import * as fs from 'fs';
 *
 * // Normal access would use a non-configurable getter
 * // Making it impossible to mock
 * const originalRef = { parent: fs, key: 'readFileSync' };
 *
 * // This function resolves to the underlying object
 * const mockableRef = getOwnProperty(fs, 'readFileSync');
 * // Now we can mock it: mockableRef.parent[mockableRef.key] = mockFn;
 * ```
 *
 * @since 1.2.2
 */

export function getOwnProperty(parent: Record<string | symbol, unknown>, key: string | symbol): DeepSearchInterface {
    const method = Reflect.get(parent, key);
    const descriptor = Object.getOwnPropertyDescriptor(parent, key);

    if (descriptor?.get && !descriptor.configurable) {
        if ('default' in parent && Reflect.get(<object> parent.default, key) === method) {
            return { parent: <Record<string, unknown>> parent.default, key };
        }
    }

    return { parent, key };
}
