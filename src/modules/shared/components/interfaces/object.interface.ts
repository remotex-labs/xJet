/**
 * Interface representing the result of a deep object search operation.
 *
 * @remarks
 * This interface provides a structured way to return the results of an object traversal
 * search, containing both the parent object and the specific key where a target value was found.
 * It allows callers to not only determine if a value was found, but also access its
 * containing object and property name.
 *
 * The interface is typically used in deep search algorithms that need to return both
 * the location of a found item and provide access to its context.
 *
 * @example
 * ```ts
 * // Example result from a search operation
 * const result: DeepSearchInterface = {
 *   parent: { id: 123, name: 'example' },
 *   key: 'name'
 * };
 *
 * // Accessing the found value through the result
 * const foundValue = result.parent[result.key]; // 'example'
 * ```
 *
 * @since 1.2.2
 */

export interface DeepSearchInterface {
    /**
     * The property key (name) where the searched element was found.
     *
     * @since 1.2.2
     */

    key: string | symbol;

    /**
     * The parent object containing the found element.
     *
     * @since 1.2.2
     */

    parent: Record<string | symbol, unknown>;
}
