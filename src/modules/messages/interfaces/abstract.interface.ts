/**
 * Import will remove at compile time
 */

import type { LogLevel } from '@messages/constants/report.constant';
import type { AbstractReporter } from '@messages/abstract/report.abstract';
import type { AssertionResultInterface } from '@messages/interfaces/messages.interface';

/**
 * Represents an extended Error object that may include an optional assertion result.
 *
 * @remarks
 * This type is used to capture errors that originate from test assertions,
 * allowing reporters or runners to access both the standard error properties
 * (`name`, `message`, `stack`) and the `matcherResult` if available.
 *
 * @example
 * ```ts
 * const error: ErrorType = new Error('Test failed');
 * error.matcherResult = {
 *   pass: false,
 *   expected: 4,
 *   received: 3
 * };
 * ```
 *
 * @see AssertionResultInterface
 * @since 1.0.0
 */

export type ErrorType = Error & { matcherResult?: AssertionResultInterface };

/**
 * Represents a constructor type for creating instances of {@link AbstractReporter}.
 *
 * @remarks
 * Used when dynamically instantiating a reporter with a given log level and optional output file path.
 *
 * @param logLevel - Minimum log level that the reporter will handle
 * @param outFilePath - Optional path to a file where reporter output will be saved
 *
 * @see AbstractReporter
 * @since 1.0.0
 */

export type ReporterConstructorType = new (logLevel: LogLevel, outFilePath?: string) => AbstractReporter;
