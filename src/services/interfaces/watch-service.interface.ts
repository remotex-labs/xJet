/**
 * Import will remove at compile time
 */

import type { FunctionLikeType } from '@remotex-labs/xjet-expect';

/**
 * Defines the signature for a test execution function.
 *
 * @remarks
 * This type represents a function that receives a map of test suite identifiers
 * to their corresponding file paths (`Record<string, string>`) and returns a `Promise<void>`.
 * It is typically used by {@link WatchService} or test runners to execute a set of test files.
 *
 * @example
 * ```ts
 * const runTests: TestExecutionType = async (suites) => {
 *   for (const [suiteId, filePath] of Object.entries(suites)) {
 *     await executeTestFile(filePath);
 *   }
 * };
 * ```
 *
 * @see WatchService
 * @since 1.0.0
 */

export type TestExecutionType =FunctionLikeType<Promise<void>, [ Record<string, string> ]>;
