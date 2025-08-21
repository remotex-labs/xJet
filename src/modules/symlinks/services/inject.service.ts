/**
 * Import will remove at compile time
 */

import type { ConstructorType } from '@remotex-labs/xjet-expect';
import type { InjectableOptionsInterface, TokenElementType } from '@symlinks/interfaces/symlinks.interface';

/**
 * Stores singleton instances of injectable classes.
 *
 * @since 1.0.0
 */

const SINGLETONS = new Map<ConstructorType, unknown>();

/**
 * Stores metadata for classes marked as injectable via `@Injectable`.
 *
 * @internal
 * @since 1.0.0
 */

const INJECTABLES = new Map<ConstructorType, InjectableOptionsInterface>();

/**
 * Marks a class as injectable and stores its configuration metadata.
 *
 * @template T - The type of the class instance
 * @template Args - The types of arguments accepted by the constructor, defaults to `unknown[]`
 *
 * @param options - Optional configuration for the injectable, including scope and factory
 *
 * @example
 * ```ts
 * @Injectable({ scope: 'singleton' })
 * class MyService {}
 * ```
 *
 * @see InjectableOptionsInterface
 * @since 1.0.0
 */

export function Injectable<T = unknown, Args extends Array<unknown> = unknown[]>(options?: InjectableOptionsInterface) {
    return function (target: new (...args: Args) => T): void {
        INJECTABLES.set(target, options || {});
    };
}

/**
 * Resolves and returns an instance of the given injectable token.
 *
 * @template T - The type of the instance to return
 * @template Args - The types of arguments passed to the constructor or factory
 *
 * @param token - The injectable class or token to resolve
 * @param args - Arguments to pass to the constructor or factory
 *
 * @returns The resolved instance of type `T`
 *
 * @throws Error - If the token is not registered as injectable via `@Injectable`
 *
 * @remarks
 * If the injectable is marked with scope `'singleton'`, the same instance will be returned
 * on the following calls. Otherwise, a new instance is created for each call.
 *
 * @example
 * ```ts
 * const service = inject(MyService);
 * ```
 *
 * @see TokenElementType
 * @since 1.0.0
 */

export function inject<T, Args extends Array<unknown>>(token: TokenElementType<T, Args>, ...args: Args): T {
    if (SINGLETONS.has(token)) return <T>SINGLETONS.get(token);

    const metadata = INJECTABLES.get(token);
    if (!metadata) throw new Error(`Cannot inject ${ token.name } – not marked @Injectable`);

    const instance: T = metadata.factory
        ? <T>metadata.factory(...args)
        : new token(...args);

    if (metadata?.scope === 'singleton') {
        SINGLETONS.set(token, instance);
    }

    return instance;
}
