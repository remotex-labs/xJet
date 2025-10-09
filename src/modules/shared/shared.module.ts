/**
 * Imports
 */

import '@components/require.component';
import { xExpect } from '@remotex-labs/xjet-expect';
import { MockState } from '@shared/states/mock.state';
import { SuiteState } from '@shared/states/suite.state';
import { inject } from '@symlinks/services/inject.service';
import * as logging from '@shared/components/log.component';
import { spyOnImplementation } from '@shared/mock/spy.mock';
import * as FakeTimer from '@shared/services/timer.service';
import { TestDirective } from '@shared/directives/test.directive';
import { DescribeDirective } from '@shared/directives/describe.directive';
import { fnImplementation, mockImplementation } from '@shared/mock/fn.mock';
import { afterAllDirective, afterEachDirective } from '@shared/directives/hook.directive';
import { beforeAllDirective, beforeEachDirective } from '@shared/directives/hook.directive';

/**
 * Clears the specified mock method on all registered mocks
 *
 * @param method - The method name to clear on all mock instances
 *
 * @throws TypeError - When called with an invalid method name
 *
 * @remarks
 * This utility function iterates through all mocks registered in the MockState
 * and calls the specified method on each one, effectively performing a batch operation
 * across all mock instances.
 *
 * @example
 * ```ts
 * // Clear all recorded calls on all mocks
 * clearMocks('resetHistory');
 *
 * // Reset behavior on all mocks
 * clearMocks('resetBehavior');
 * ```
 *
 * @see MockState
 *
 * @since 1.0.0
 */

function clearMocks(method: keyof MockState): void {
    MockState.mocks.forEach((mock) => {
        const instance = mock.deref();
        if(!instance) {
            return MockState.mocks.delete(mock);
        }

        instance[method]();
    });
}

/**
 * Set global
 */

const setupGlobals = (): void => {
    const globals = globalThis as { [key: string]: unknown; };

    globals.xJet = {
        /**
         * Mock
         */

        fn: fnImplementation,
        mock: mockImplementation,
        spyOn: spyOnImplementation,
        clearAllMocks: (): void => clearMocks('mockClear'),
        resetAllMocks: (): void => clearMocks('mockReset'),
        restoreAllMocks: (): void => clearMocks('mockRestore'),

        /**
         * Logs
         */

        log: logging.log,
        info: logging.info,
        warn: logging.warn,
        error: logging.error,
        debug: logging.debug,

        /**
         * Timers
         */

        runAllTimers: FakeTimer.runAllTimers,
        useFakeTimers: FakeTimer.useFakeTimers,
        useRealTimers: FakeTimer.useRealTimers,
        advanceTimersByTime: FakeTimer.advanceTimersByTime,
        runOnlyPendingTimers: FakeTimer.runOnlyPendingTimers
    };

    globals.expect = xExpect;
    globals.state = inject(SuiteState);
    globals.it = TestDirective.getInstance();
    globals.test = TestDirective.getInstance();
    globals.describe = DescribeDirective.getInstance();
    globals.afterAll = afterAllDirective;
    globals.beforeAll = beforeAllDirective;
    globals.afterEach = afterEachDirective;
    globals.beforeEach = beforeEachDirective;
};

setupGlobals();
