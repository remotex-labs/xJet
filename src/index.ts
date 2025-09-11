/**
 * Import will remove at compile time
 */

import type { xExpect } from '@remotex-labs/xjet-expect';
import type { fnImplementation } from '@shared/mock/fn.mock';
import type { mockImplementation } from '@shared/mock/fn.mock';
import type { spyOnImplementation } from '@shared/mock/spy.mock';
import type { afterAllDirective, afterEachDirective } from '@shared/directives/hook.directive';
import type { beforeAllDirective, beforeEachDirective } from '@shared/directives/hook.directive';
import type { TestDirectiveInterface } from '@shared/directives/interfaces/test-directive.interface';
import type { DescribeDirectiveInterface } from '@shared/directives/interfaces/describe-directive.interface';

/**
 * Exports types
 */

export type { xJetConfig, TestRunnerInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Exports modules
 */

export type * from '@messages/messages.module';
export { MockState } from '@shared/states/mock.state';
export { encodeErrorSchema } from '@packets/packets.module';

/**
 * Export global variables
 */

declare global {
    namespace xJet {
        const fn: typeof fnImplementation;
        const mock: typeof mockImplementation;
        const spyOn: typeof spyOnImplementation;
        const log: typeof console.log;
        const info: typeof console.info;
        const warn: typeof console.warn;
        const error: typeof console.error;
        const debug: typeof console.error;
        const clearAllMocks: () => void;
        const resetAllMocks: () => void;
        const restoreAllMocks: () => void;
    }

    const it: TestDirectiveInterface;
    const test: TestDirectiveInterface;
    const expect: typeof xExpect;
    const describe: DescribeDirectiveInterface;
    const afterAll: typeof afterAllDirective;
    const beforeAll: typeof beforeAllDirective;
    const afterEach: typeof afterEachDirective;
    const beforeEach: typeof beforeEachDirective;
}

export {};
