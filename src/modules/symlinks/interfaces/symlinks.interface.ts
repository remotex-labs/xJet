/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';

/**
 * Represents a constructor type for a given element.
 *
 * @template T - The type of the instance created by the constructor
 * @template Args - The types of arguments accepted by the constructor, defaults to `unknown[]`
 *
 * @see FunctionType
 * @since 1.0.0
 */

export type TokenElementType<T, Args extends Array<unknown> = unknown[]> = new (...args: Args) => T;

/**
 * Options for configuring an injectable service.
 *
 * @remarks
 * Used by the {@link Injectable} decorator to specify lifecycle scope
 * and custom factory function for service instantiation.
 *
 * @since 1.0.0
 */

export interface InjectableOptionsInterface {
    /**
     * Lifecycle scope of the service.
     * - `'singleton'` - Only one instance is created and shared
     * - `'transient'` - A new instance is created each time it is requested
     *
     * @default 'singleton'
     * @since 1.0.0
     */

    scope?: 'singleton' | 'transient';

    /**
     * Custom factory function used to create the service instance.
     * @since 1.0.0
     */

    factory?: FunctionType;
}
