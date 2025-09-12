/**
 * Import will remove at compile time
 */

import type { HookModel } from '@shared/models/hook.model';

/**
 * Represents options that control the execution behavior of a `describe` block.
 *
 * @remarks
 * This interface is used to configure specific conditions for a `describe` block,
 * such as skipping the execution (`skip`) or running it exclusively (`only`).
 * Both properties are optional and allow flexible test suite configuration.
 *
 * @example
 * ```ts
 * const options: DescribeOptionsInterface = {
 *   skip: true, // This described block will be skipped
 *   only: false // Not marked as exclusive; can be omitted
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface DescribeOptionsInterface {
    /**
     * If true, the `describe` block will be skipped.
     * @since 1.0.0
     */

    skip?: boolean;

    /**
     * If true, the `describe` block will run exclusively, ignoring other blocks.
     * @since 1.0.0
     */

    only?: boolean;
}

/**
 * Represents the collection of hooks for a `describe` block.
 *
 * @remarks
 * Each `describe` block can define multiple lifecycle hooks:
 * - `beforeAll` → Runs once before all tests in the block.
 * - `afterAll` → Runs once after all tests in the block.
 * - `beforeEach` → Runs before each test in the block.
 * - `afterEach` → Runs after each test in the block.
 *
 * These hooks are stored as arrays of {@link HookModel} instances.
 *
 * @example
 * ```ts
 * const hooks: DescribeHooksInterface = {
 *   beforeAll: [new HookModel(() => {}, 5000)],
 *   afterAll: [new HookModel(() => {}, 5000)],
 *   beforeEach: [new HookModel(() => {}, 5000)],
 *   afterEach: [new HookModel(() => {}, 5000)]
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface DescribeHooksInterface {
    /**
     * Hooks to execute once after all tests in the `describe` block.
     *
     * @see HookModel
     * @since 1.0.0
     */

    afterAll: Array<HookModel>;

    /**
     * Hooks to execute once before all tests in the `describe` block.
     *
     * @see HookModel
     * @since 1.0.0
     */

    beforeAll: Array<HookModel>;

    /**
     * Hooks to execute before each test in the `describe` block.
     *
     * @see HookModel
     * @since 1.0.0
     */

    beforeEach: Array<HookModel>;

    /**
     * Hooks to execute after each test in the `describe` block.
     *
     * @see HookModel
     * @since 1.0.0
     */

    afterEach: Array<HookModel>;
}

/**
 * Represents the execution context for a test suite, tracking errors and overall status.
 *
 * @remarks
 * - `hasError` is `true` if any test or suite has failed, indicating that bail mode is active
 *   and the runner should not execute the remaining tests or describe blocks in the current suites.
 * - `beforeAllErrors` collects errors thrown during `beforeAll` hooks.
 * - `afterAllErrors` collects errors thrown during `afterAll` hooks.
 *
 * @example
 * ```ts
 * const context: ContextInterface = {
 *   hasError: false,
 *   beforeAllErrors: [],
 *   afterAllErrors: []
 * };
 *
 * if (context.hasError) {
 *   console.log("Bail is active. Skipping remaining tests.");
 * }
 * ```
 *
 * @since 1.0.0
 */

export interface ContextInterface {
    /**
     * Indicates whether any test or suite has failed. When `true`, bail mode is active,
     * and the runner should skip the remaining tests or describe blocks.
     *
     * @since 1.0.0
     */

    hasError: boolean;

    /**
     * Errors thrown during `beforeAll` hooks.
     *
     * @since 1.0.0
     */

    beforeAllErrors: Array<unknown>;

    /**
     * Errors thrown during `afterAll` hooks.
     *
     * @since 1.0.0
     */

    afterAllErrors: Array<unknown>;
}
