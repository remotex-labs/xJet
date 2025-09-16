/**
 * Imports
 */

import { xterm } from '@remotex-labs/xansi/xterm.component';

/**
 * The fixed height in rows reserved for the console status display.
 *
 * @remarks
 * Used by {@link ConsoleReporter} and {@link ShadowRenderer} to reserve
 * space for the summary of suites and tests at the bottom of the terminal.
 *
 * @since 1.0.0
 */

export const STATIC_HEIGHT = 4;

/**
 * ANSI color functions for rendering different statuses in the console.
 *
 * @remarks
 * Each property is a function that wraps a string in the corresponding color using `xterm.hex`.
 *
 * @example
 * ```ts
 * console.log(formatStatus.passed('Test Passed'));
 * ```
 *
 * @since 1.0.0
 */

export const formatStatus = {
    todo: xterm.hex('#da5aec'),
    failed: xterm.hex('#F08080'),
    passed: xterm.hex('#90EE90'),
    skipped: xterm.hex('#fcaa63'),
    running: xterm.hex('#FFD966'),
    pending: xterm.hex('#808080')
} as const;

/**
 * Mapping of {@link ConsoleState} to their corresponding display string with ANSI styling.
 *
 * @remarks
 * Used for rendering the status prefix of each suite in the console output.
 *
 * @example
 * ```ts
 * console.log(statePrefix[ConsoleState.Failed]); // Outputs a red "[ FAILED ]"
 * ```
 *
 * @since 1.0.0
 */

export const statePrefix: Record<ConsoleState, string> = {
    [ConsoleState.Pending]: formatStatus.pending('[ Pending ]'),
    [ConsoleState.Run]: formatStatus.running('[ RUNNING ]'),
    [ConsoleState.Skipped]: formatStatus.skipped('[ SKIPPED ]'),
    [ConsoleState.Passed]: formatStatus.passed('[ PASSED  ]'),
    [ConsoleState.Failed]: formatStatus.failed('[ FAILED  ]')
};

/**
 * Represents the possible states of a suite or test in the console reporter.
 *
 * @remarks
 * Used to determine which ANSI color and prefix to display for each suite or test.
 *
 * @example
 * ```ts
 * if (state === ConsoleState.Failed) {
 *   console.log('This suite failed!');
 * }
 * ```
 *
 * @since 1.0.0
 */

export const enum ConsoleState {
    Run = 0,
    Failed = 2,
    Passed = 3,
    Skipped = 4,
    Pending = 5
}
