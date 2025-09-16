/**
 * Represents the types of lifecycle hooks that can be used in testing frameworks or similar systems.
 *
 * @remarks
 * The `HookType` enum defines constants for various lifecycle stages
 * that are commonly used to implement setup and teardown logic
 * in testing or other procedural workflows.
 *
 * @since 1.0.0
 */

export const enum HookType {
    AFTER_ALL = 'afterAll',
    BEFORE_ALL = 'beforeAll',
    AFTER_EACH = 'afterEach',
    BEFORE_EACH = 'beforeEach'
}
