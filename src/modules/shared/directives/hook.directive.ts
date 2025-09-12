/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';

/**
 * Imports
 */

import { HookModel } from '@shared/models/hook.model';
import { SuiteState } from '@shared/states/suite.state';
import { inject } from '@symlinks/services/inject.service';
import { getTrimmedStackString } from '@components/location.component';
import { HookType } from '@shared/models/constants/hook.model.constants';

/**
 * Default timeout
 */

const DEFAULT_TIMEOUT = globalThis.__XJET?.runtime.timeout ?? 5000;

/**
 * Creates and registers a hook with the current test suite
 *
 * @param hookType - Type of hook to register
 * @param callback - Function to execute for this hook
 * @param location - The precise source code location where the error occurred
 * @param timeout - Maximum execution time in milliseconds
 * @returns void
 *
 * @example
 * ```ts
 * createHook(HookType.BEFORE_EACH, () => {
 *   // Setup code to run before each test
 *   resetTestDatabase();
 * }, 10000);
 * ```
 *
 * @see HookType
 * @see HookModel
 * @see SuiteState
 *
 * @since 1.0.0
 */

export function createHook(hookType: HookType, callback: FunctionType, location: string, timeout: number = DEFAULT_TIMEOUT): void {
    const hook = new HookModel(callback, timeout);
    hook.setLocation(location);
    inject(SuiteState).describe.addHook(hookType, hook);
}

/**
 * Registers an after-all hook to be executed once after all tests in a suite have completed
 *
 * @param callback - Function to execute after all tests in the suite
 * @param timeout - Maximum execution time in milliseconds
 * @returns void
 *
 * @throws Error - If called outside a test suite context
 *
 * @remarks
 * This function is a wrapper around the createHook function, specifically for creating AFTER_ALL hooks.
 * After-all hooks are useful for cleanup operations that should occur once after all tests complete.
 *
 * @example
 * ```ts
 * afterAllDirective(() => {
 *   // Teardown code to run after all tests
 *   disconnectFromDatabase();
 * }, 10000);
 * ```
 *
 * @see createHook
 * @see HookType.AFTER_ALL
 *
 * @since 1.0.0
 */

export function afterAllDirective(callback: FunctionType, timeout?: number): void {
    createHook(HookType.AFTER_ALL, callback, getTrimmedStackString(), timeout);
}

/**
 * Registers a before-all hook to be executed once before any tests in a suite run
 *
 * @param callback - Function to execute before any tests in the suite
 * @param timeout - Maximum execution time in milliseconds
 * @returns void
 *
 * @throws Error - If called outside a test suite context
 *
 * @remarks
 * This function is a wrapper around the createHook function, specifically for creating BEFORE_ALL hooks.
 * Before-all hooks are useful for setup operations that should occur once before any tests run.
 *
 * @default timeout 5000
 *
 * @example
 * ```ts
 * beforeAllDirective(() => {
 *   // Setup code to run before any tests
 *   initializeTestDatabase();
 * }, 10000);
 * ```
 *
 * @see createHook
 * @see HookType.BEFORE_ALL
 *
 * @since 1.0.0
 */

export function beforeAllDirective(callback: FunctionType, timeout?: number): void {
    createHook(HookType.BEFORE_ALL, callback, getTrimmedStackString(), timeout);
}

/**
 * Registers an after-each hook to be executed after each test in a suite completes
 *
 * @param callback - Function to execute after each test
 * @param timeout - Maximum execution time in milliseconds
 * @returns void
 *
 * @throws Error - If called outside a test suite context
 *
 * @remarks
 * This function is a wrapper around the createHook function, specifically for creating AFTER_EACH hooks.
 * After-each hooks run after each test case and are useful for cleanup operations that should occur
 * after every individual test.
 *
 * @default timeout 5000
 *
 * @example
 * ```ts
 * afterEachDirective(() => {
 *   // Cleanup code to run after each test
 *   resetTestState();
 * }, 8000);
 * ```
 *
 * @see createHook
 * @see HookType.AFTER_EACH
 *
 * @since 1.0.0
 */

export function afterEachDirective(callback: FunctionType, timeout?: number): void {
    createHook(HookType.AFTER_EACH, callback, getTrimmedStackString(), timeout);
}

/**
 * Registers a before-each hook to be executed before each test in a suite runs
 *
 * @param callback - Function to execute before each test
 * @param timeout - Maximum execution time in milliseconds
 *
 * @returns void
 *
 * @throws Error - If called outside a test suite context
 *
 * @remarks
 * This function is a wrapper around the createHook function, specifically for creating BEFORE_EACH hooks.
 * Before-each hooks run before each test case and are useful for setup operations that should occur
 * before every individual test.
 *
 * @default timeout 5000
 *
 * @example
 * ```ts
 * beforeEachDirective(() => {
 *   // Setup code to run before each test
 *   prepareTestEnvironment();
 * }, 8000);
 * ```
 *
 * @see createHook
 * @see HookType.BEFORE_EACH
 *
 * @since 1.0.0
 */

export function beforeEachDirective(callback: FunctionType, timeout?: number): void {
    createHook(HookType.BEFORE_EACH, callback, getTrimmedStackString(), timeout); // Fixed a bug here - was using AFTER_ALL
}
