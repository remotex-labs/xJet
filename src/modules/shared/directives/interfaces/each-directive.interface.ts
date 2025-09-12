/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@remotex-labs/xjet-expect';

/**
 * Type definition for a test executor function
 *
 * @since 1.0.0
 */

export type InvokeType = (description: string, block: FunctionType, args: Array<unknown>, timeout?: number) => void;
