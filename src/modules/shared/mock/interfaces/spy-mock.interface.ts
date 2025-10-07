/**
 * Interface representing the internal state of a mock proxy.
 *
 * @remarks
 * This interface defines the structure for storing and managing the internal state
 * of mock proxies, including mock implementations and custom property access behavior.
 *
 * @since 1.2.2
 */

export interface MockProxyStateInterface {
    /**
     * Map storing mock implementations for specific properties.
     * Keys are property names, values are the mock implementations.
     *
     * @since 1.2.2
     */

    mocks: Map<PropertyKey, unknown>;

    /**
     * Optional custom getter function that overrides default property access behavior.
     * When provided, this function is called for all property access on the mock proxy.
     *
     * @since 1.2.2
     */

    customGetter: ((target: object, prop: PropertyKey, receiver: unknown) => unknown) | null;
}

/**
 * Interface representing a mock proxy object.
 *
 * @remarks
 * A `MockProxyInterface` defines the structure of objects that have been
 * wrapped by a mocking proxy system. These proxies intercept property access
 * and allow for dynamic replacement or monitoring of object properties.
 *
 * @since 1.2.2
 */

export interface MockProxyInterface extends Record<PropertyKey, unknown> {
    /**
     * A boolean flag that indicates this object is a mock proxy.
     * Used for type checking and identification of mock objects.
     *
     * @since 1.2.2
     */

    readonly __isMockProxy__?: true;

    /**
     * Provides access to the internal state of the mock proxy,
     * including mapped mock implementations and custom getter functions.
     *
     * @since 1.2.2
     */

    readonly __MockMap__?: MockProxyStateInterface;
}
