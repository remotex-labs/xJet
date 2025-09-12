/**
 * Import will remove at compile time
 */

import type { TestModel } from '@shared/models/test.model';
import type { DescribeModel } from '@shared/models/describe.model';

/**
 * Imports
 */

import { serialize } from '@remotex-labs/xjet-expect';
import { encodePacket } from '@packets/packets.module';
import { SuiteState } from '@shared/states/suite.state';
import { inject } from '@symlinks/services/inject.service';
import { LogLevel } from '@messages/constants/report.constant';
import { getInvocationLocation } from '@components/location.component';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Creates a logging function that formats and dispatches log messages with timestamps
 *
 * @template T - Console method type that determines the log level
 * @param type - The type of console method (log, info, warn, error) to create a handler for
 * @returns A function that accepts any number of arguments, formats them, and dispatches a log event
 *
 * @throws TypeError - When invalid arguments are provided to the returned function
 *
 * @remarks
 * This function acts as a factory for creating specialized logging handlers. Each handler:
 * - Timestamps the log entry with ISO format
 * - Formats all arguments into string representations
 * - Dispatches the log event with the appropriate log level
 * - Maintains a consistent format for all log messages
 *
 * @example
 * ```ts
 * const logInfo = createLogHandler('info');
 * logInfo('User', user.id, 'logged in successfully');
 * // Dispatches a log event with level: 'INFO', formatted arguments, and timestamp
 * ```
 *
 * @see formatValue
 * @see dispatch
 * @see SchemaType
 * @see LogLevel
 *
 * @since 1.0.0
 */

export function createLogHandler(type: keyof typeof LogLevel) {
    return function (...args: unknown[]): void {
        let parent: TestModel | DescribeModel | undefined = inject(SuiteState).test;
        if (!parent) {
            parent = inject(SuiteState).describe;
        }

        const context = [ ...parent?.ancestry ?? [], parent?.description ].join(',');

        // Format arguments for the description
        const formattedArgs = args.map((data: unknown) => serialize(data).join('\n')).join(' ');
        const location = getInvocationLocation();

        // Dispatch log event
        dispatch(encodePacket(PacketKind.Log, {
            level: LogLevel[type],
            message: formattedArgs,
            ancestry: context ?? '',
            invocation: location
        }));
    };
}

/**
 * Standard log level function for general purpose logging
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const log = createLogHandler('Info');

/**
 * Informational log function for highlighting noteworthy application events
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const info = createLogHandler('Info');

/**
 * Warning log function for potential issues that aren't errors
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const warn = createLogHandler('Warn');

/**
 * Error log function for reporting application errors and exceptions
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const error = createLogHandler('Error');

/**
 * Debug log function for detailed diagnostic information
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const debug = createLogHandler('Debug');
