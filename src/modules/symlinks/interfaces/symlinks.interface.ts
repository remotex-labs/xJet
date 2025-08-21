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
 * Configuration options for marking a class or provider as injectable.
 *
 * @param scope - The lifecycle scope of the injectable, either 'singleton' or 'transient'
 * @param factory - Optional factory function used to create instances
 * @default scope - 'transient'
 *
 * @see FunctionType
 * @since 1.0.0
 */

export interface InjectableOptionsInterface {
    scope?: 'singleton' | 'transient';
    factory?: FunctionType;
}
