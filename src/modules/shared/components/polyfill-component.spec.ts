/**
 * Import will remove at compile time
 */

import type { BoundInterface } from '@shared/components/interfaces/polyfill-component.interface';

/**
 * Imports
 */

import './polyfill.component';

/**
 * Tests
 */

describe('Function.prototype.bind Proxy', () => {
    test('should bind the context and parameters correctly', () => {
        function exampleFunction(this: Record<string, number>, a: number, b: number) {
            return this.value + a + b;
        }

        const context = { value: 10 };
        const boundFunction: BoundInterface & ((...args: Array<number>) => number) = exampleFunction.bind(context, 5);

        // Original functionality check
        expect(boundFunction(15)).toBe(30); // 10 (context.value) + 5 (bound param) + 15 (param)

        // Proxy-added properties check
        expect(boundFunction.__boundThis).toBe(context);
        expect(boundFunction.__boundArgs).toEqual([ 5 ]);
    });

    test('should handle functions without any bound arguments', () => {
        function exampleFunction(this: Record<string, number>, a: number) {
            return this.value + a;
        }

        const context = { value: 20 };
        const boundFunction: BoundInterface & ((...args: Array<number>) => number) = exampleFunction.bind(context);

        // Original functionality check
        expect(boundFunction(10)).toBe(30); // 20 (context.value) + 10 (param)

        // Proxy-added properties check
        expect(boundFunction.__boundThis).toBe(context);
        expect(boundFunction.__boundArgs).toEqual([]);
    });

    test('should handle functions bound without a specific context', () => {
        function exampleFunction(a: number) {
            return a * 2;
        }

        const boundFunction: BoundInterface & ((...args: Array<number>) => number) = exampleFunction.bind(null, 5);

        // Original functionality check
        expect(boundFunction()).toBe(10); // 5 * 2

        // Proxy-added properties check
        expect(boundFunction.__boundThis).toBe(null);
        expect(boundFunction.__boundArgs).toEqual([ 5 ]);
    });
});
