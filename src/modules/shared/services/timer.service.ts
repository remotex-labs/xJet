/**
 * Import will remove at compile time
 */

import type { FunctionLikeType } from '@remotex-labs/xjet-expect';
import type { TimerInterface } from '@shared/services/interfaces/timer-service.interface';

/**
 * Imports
 */

import { Injectable, inject } from '@symlinks/services/inject.service';

/**
 * Provides a virtual timer system that mimics native `setTimeout`/`setInterval`
 * while allowing controlled execution for deterministic tests.
 *
 * @remarks
 * This service replaces the global timing functions with fake timers so that
 * time can be manually advanced and callbacks triggered predictably.
 * It is intended for unit testing scenarios where you need full control over
 * asynchronous timing without waiting in real time.
 *
 * @example
 * ```ts
 * useFakeTimers();
 * setTimeout(() => console.log('done'), 1000);
 * advanceTimersByTime(1000); // logs 'done' immediately
 * useRealTimers();
 * ```
 *
 * @since 1.1.0
 */

@Injectable({
    scope: 'singleton'
})
export class TimerService {
    /**
     * Active timers managed by the fake timer engine.
     * @since 1.1.0
     */

    readonly timers = new Map<number, TimerInterface>();

    /**
     * Stores original `Date.now` to restore when real timers are re-enabled.
     * @since 1.1.0
     */

    readonly originalDateNow = Date.now;

    /**
     * Stores original global `setTimeout`.
     * @since 1.1.0
     */

    readonly originalSetTimeout = globalThis.setTimeout;

    /**
     * Stores original global `setInterval`.
     * @since 1.1.0
     */

    readonly originalSetInterval = globalThis.setInterval;

    /**
     * Stores original global `clearTimeout`.
     * @since 1.1.0
     */

    readonly originalClearTimeout = globalThis.clearTimeout;

    /**
     * Stores original global `clearInterval`.
     * @since 1.1.0
     */

    readonly originalClearInterval = globalThis.clearInterval;

    /**
     * Simulated current timestamp for the fake timers.
     * @since 1.1.0
     */

    private now = 0;

    /**
     * Incremental id used to register timers uniquely.
     * @since 1.1.0
     */

    private nextId = 1;

    /**
     * Replaces the global timer functions with in-memory fakes.
     *
     * @remarks
     * After calling this method, any calls to `setTimeout`, `setInterval`,
     * `clearTimeout`, or `clearInterval` will be intercepted and stored in the
     * {@link timers} map instead of scheduling real OS timers.
     * This allows tests to control time progression manually using
     * {@link advanceTimersByTime}, {@link runAllTimers}, or
     * {@link runOnlyPendingTimers}.
     *
     * @example
     * ```ts
     * timerService.useFakeTimers();
     * const id = setTimeout(() => console.log('done'), 1000);
     * timerService.advanceTimersByTime(1000); // logs "done" immediately
     * ```
     *
     * @since 1.1.0
     */

    useFakeTimers(): void {
        const setTimeout = (cb: FunctionLikeType<void>, delay: number = 0, ...args: Array<unknown>): number => {
            const id = this.nextId++;
            this.timers.set(id, { id, callback: cb, time: this.now + delay, interval: null, args: args ?? [] });

            return id;
        };

        const setInterval = (cb: FunctionLikeType<void>, interval: number = 0): number => {
            const id = this.nextId++;
            this.timers.set(id, { id, callback: cb, time: this.now + interval, interval, args: [] });

            return id;
        };

        const clearTimeout = (id: number): void => {
            this.timers.delete(id);
        };


        const clearInterval = (id: number): void => {
            this.timers.delete(id);
        };

        const global = <Record<string, unknown>> globalThis;
        global.setTimeout = setTimeout;
        global.setInterval = setInterval;
        global.clearTimeout = clearTimeout;
        global.clearInterval = clearInterval;
    }

    /**
     * Restores the original global timer APIs and `Date.now`.
     *
     * @remarks
     * This method undoes the effects of {@link useFakeTimers}, re-binding
     * the native implementations of `setTimeout`, `setInterval`,
     * `clearTimeout`, `clearInterval`, and `Date.now`.
     * After calling this, timers once again behave according to real system
     * time and manual advancement methods such as
     * {@link advanceTimersByTime} no longer apply.
     *
     * @example
     * ```ts
     * timerService.useFakeTimers();
     * // ...run tests with controlled time...
     * timerService.useRealTimers(); // restore native timers
     * ```
     *
     * @since 1.1.0
     */

    useRealTimers(): void {
        this.timers.clear();
        globalThis.setTimeout = this.originalSetTimeout;
        globalThis.clearTimeout = this.originalClearTimeout;
        globalThis.setInterval = this.originalSetInterval;
        globalThis.clearInterval = this.originalClearInterval;
        Date.now = this.originalDateNow;
    }

    /**
     * Clears all active fake timers.
     *
     * @remarks
     * This method removes every timer currently stored in {@link timers},
     * effectively resetting the fake timer state without advancing time.
     * It is useful for cleaning up between tests to ensure no lingering
     * scheduled callbacks remain.
     *
     * @example
     * ```ts
     * useFakeTimers();
     * setTimeout(() => console.log('A'), 100);
     * clearAllTimers(); // removes all scheduled timers
     * advanceTimersByTime(100); // nothing happens
     * ```
     *
     * @since 1.3.0
     */

    clearAllTimers(): void {
        this.timers.clear();
    }

    /**
     * Advances the simulated clock by a specific number of milliseconds and
     * executes all timers whose scheduled time has elapsed.
     *
     * @remarks
     * Use this method after calling {@link useFakeTimers} to fast-forward the
     * internal clock without waiting in real time.
     * Any `setTimeout` or `setInterval` callbacks scheduled within the
     * advanced period will run immediately in order of their scheduled time.
     *
     * @param ms - The number of milliseconds to move the simulated time forward.
     *
     * @example
     * ```ts
     * timerService.useFakeTimers();
     * setTimeout(() => console.log('done'), 500);
     * timerService.advanceTimersByTime(500); // logs "done"
     * ```
     *
     * @since 1.1.0
     */

    advanceTimersByTime(ms: number) : void {
        this.now += ms;
        this.runDueTimers();
    }

    /**
     * Executes every scheduled timer until none remain.
     *
     * @remarks
     * This method repeatedly advances the simulated clock to the next
     * scheduled timer and runs its callback until the {@link timers} map
     * is empty.
     * It is useful when you want to immediately flush **all** pending
     * `setTimeout` or `setInterval` callbacks regardless of their delay,
     * without specifying a time increment.
     *
     * @example
     * ```ts
     * timerService.useFakeTimers();
     * setTimeout(() => console.log('A'), 100);
     * setTimeout(() => console.log('B'), 200);
     * timerService.runAllTimers(); // logs "A" then "B"
     * ```
     *
     * @since 1.1.0
     */

    runAllTimers(): void {
        while (this.timers.size > 0) {
            this.now = Math.min(...Array.from(this.timers.values()).map(t => t.time));
            this.runDueTimers();
        }
    }

    /**
     * Executes only the timers that are currently pending at the time of call,
     * without running any new timers that may be scheduled by those callbacks.
     *
     * @remarks
     * Unlike {@link runAllTimers}, this method captures the set of timers
     * that exist when the method is invoked and restricts execution to that
     * initial set.
     * If any of those timers schedule additional timers while running,
     * the newly scheduled ones will **not** be executed during this call.
     *
     * @example
     * ```ts
     * timerService.useFakeTimers();
     * setTimeout(() => {
     *   console.log('first');
     *   setTimeout(() => console.log('second'), 100);
     * }, 100);
     *
     * timerService.runOnlyPendingTimers();
     * // Logs only "first" because "second" was created afterward.
     * ```
     *
     * @since 1.1.0
     */

    runOnlyPendingTimers(): void {
        const pendingTimers = new Set(this.timers.keys());

        while (pendingTimers.size > 0) {
            const nextTimerTimes = Array.from(this.timers.values())
                .filter(t => pendingTimers.has(t.id))
                .map(t => t.time);

            if (nextTimerTimes.length === 0) break;

            this.now = Math.min(...nextTimerTimes);
            this.runDueTimers(pendingTimers);

            for (const id of pendingTimers) {
                if (!this.timers.has(id)) pendingTimers.delete(id);
            }
        }
    }

    /**
     * Asynchronous equivalent of {@link runAllTimers}.
     *
     * @remarks
     * This method first yields to the event loop to allow any pending promises
     * to resolve before executing all remaining fake timers.
     * It ensures a deterministic sequence when timers and microtasks coexist.
     *
     * @example
     * ```ts
     * useFakeTimers();
     * Promise.resolve().then(() => console.log('microtask'));
     * setTimeout(() => console.log('timer'), 0);
     * await timerService.runAllTimersAsync();
     * // Logs:
     * // microtask
     * // timer
     * ```
     *
     * @since 1.3.0
     */

    async runAllTimersAsync(): Promise<void> {
        await Promise.resolve();
        this.runAllTimers();
    }

    /**
     * Asynchronous equivalent of {@link runOnlyPendingTimers}.
     *
     * @remarks
     * This method first yields to the event loop to allow any pending promises
     * to resolve before executing only currently pending fake timers.
     * Timers scheduled during execution will not run until explicitly advanced later.
     *
     * @example
     * ```ts
     * useFakeTimers();
     * setTimeout(() => {
     *   console.log('first');
     *   setTimeout(() => console.log('second'), 100);
     * }, 100);
     * await timerService.runOnlyPendingTimersAsync();
     * // Logs:
     * // first
     * ```
     *
     * @since 1.3.0
     */

    async runOnlyPendingTimersAsync(): Promise<void> {
        await Promise.resolve();
        this.runOnlyPendingTimers();
    }

    /**
     * Executes all timers whose scheduled time is less than or equal to the
     * current simulated time (`this.now`).
     *
     * @remarks
     * This internal method is called by {@link advanceTimersByTime},
     * {@link runAllTimers}, and {@link runOnlyPendingTimers} to trigger
     * due timers.
     * If `limitTimers` are provided, only timers included in that set are executed.
     * Repeating timers (`setInterval`) are rescheduled automatically until
     * their next execution time exceeds the current simulated time.
     *
     * @param limitTimers - Optional set of timer IDs to restrict execution.
     *
     * @internal
     * @since 1.1.0
     */

    private runDueTimers(limitTimers?: Set<number>): void {
        let executed = true;
        while (executed) {
            executed = false;

            const timers = Array.from(this.timers.values()).sort((a, b) => a.time - b.time);

            for (const timer of timers) {
                if (!this.timers.has(timer.id)) continue;
                if (limitTimers && !limitTimers.has(timer.id)) continue;

                if (timer.time <= this.now) {
                    if (timer.interval !== null) {
                        while (timer.time <= this.now) {
                            timer.callback();
                            timer.time += timer.interval;
                        }
                    } else {
                        timer.callback();
                        this.timers.delete(timer.id);
                    }
                    executed = true;
                }
            }
        }
    }
}

/**
 * Globally enables fake timers using the shared {@link TimerService}.
 *
 * @remarks
 * After calling this function, all calls to `setTimeout`, `setInterval`,
 * `clearTimeout`, and `clearInterval` will be intercepted by the
 * {@link TimerService} and stored in-memory instead of executing in real time.
 * This allows deterministic testing by manually advancing time with
 * {@link advanceTimersByTime}, {@link runAllTimers}, or
 * {@link runOnlyPendingTimers}.
 *
 * @example
 * ```ts
 * useFakeTimers();
 * setTimeout(() => console.log('done'), 1000);
 * advanceTimersByTime(1000); // logs "done" immediately
 * ```
 *
 * @since 1.1.0
 */

export function useFakeTimers(): void {
    inject(TimerService).useFakeTimers();
}

/**
 * Restores real timers globally using the shared {@link TimerService}.
 *
 * @remarks
 * This function undoes the effects of {@link useFakeTimers}, restoring the
 * native implementations of `setTimeout`, `setInterval`, `clearTimeout`,
 * `clearInterval`, and `Date.now`.
 * After calling this, timers once again behave according to real system time,
 * and manual advancement methods like {@link advanceTimersByTime} no longer apply.
 *
 * @example
 * ```ts
 * useFakeTimers();
 * // ...run tests with controlled time...
 * useRealTimers(); // restore native timers
 * ```
 *
 * @since 1.1.0
 */

export function useRealTimers(): void {
    inject(TimerService).useRealTimers();
}

/**
 * Executes all timers currently registered in the {@link TimerService}.
 *
 * @remarks
 * This function repeatedly runs all pending `setTimeout` and `setInterval`
 * callbacks until no timers remain.
 * It is equivalent to calling {@link TimerService.runAllTimers} on the
 * injected service instance and is useful for immediately flushing
 * all scheduled timers in tests.
 *
 * @example
 * ```ts
 * useFakeTimers();
 * setTimeout(() => console.log('A'), 100);
 * setTimeout(() => console.log('B'), 200);
 * runAllTimers(); // logs "A" then "B"
 * ```
 *
 * @since 1.1.0
 */

export function runAllTimers(): void {
    inject(TimerService).runAllTimers();
}

/**
 * Removes all scheduled fake timers from the {@link TimerService}.
 *
 * @remarks
 * This function clears all active timers registered in the shared timer service,
 * effectively canceling any pending callbacks that would have run during
 * timer advancement.
 *
 * It's useful for resetting the fake timer state between test cases to ensure
 * no lingering timers affect further tests or for scenarios where you
 * need to abort all pending operations.
 *
 * @example
 * ```ts
 * useFakeTimers();
 * setTimeout(() => console.log('A'), 100);
 * setTimeout(() => console.log('B'), 200);
 *
 * clearAllTimers(); // removes all scheduled timers
 * advanceTimersByTime(1000); // nothing happens, not show any logs
 * ```
 *
 * @since 1.3.0
 */

export function clearAllTimers(): void {
    inject(TimerService).clearAllTimers();
}

/**
 * Executes only the timers that are pending at the time of invocation.
 *
 * @remarks
 * This function runs the callbacks of timers that exist when the function
 * is called, without executing any new timers that may be scheduled
 * during their execution.
 * It delegates to {@link TimerService.runOnlyPendingTimers} on the injected
 * service instance.
 *
 * @example
 * ```ts
 * useFakeTimers();
 * setTimeout(() => {
 *   console.log('first');
 *   setTimeout(() => console.log('second'), 100);
 * }, 100);
 *
 * runOnlyPendingTimers();
 * // Logs only "first"; "second" is not executed yet
 * ```
 *
 * @since 1.1.0
 */

export function runOnlyPendingTimers(): void {
    inject(TimerService).runOnlyPendingTimers();
}

/**
 * Advances the simulated time by a specified number of milliseconds and
 * executes all timers that are due.
 *
 * @remarks
 * This function delegates to {@link TimerService.advanceTimersByTime}
 * on the injected service instance.
 * It is intended to be used after {@link useFakeTimers} to fast-forward
 * time in tests without waiting for real timers.
 *
 * @param ms - The number of milliseconds to advance (default is `0`).
 *
 * @example
 * ```ts
 * useFakeTimers();
 * setTimeout(() => console.log('done'), 500);
 * advanceTimersByTime(500); // logs "done"
 * ```
 *
 * @since 1.1.0
 */

export function advanceTimersByTime(ms: number = 0): void {
    inject(TimerService).advanceTimersByTime(ms);
}

/**
 * Asynchronous equivalent of {@link runAllTimers}.
 *
 * @remarks
 * Yields to the event loop before running all pending fake timers.
 * Useful when working with both Promises and fake timers.
 *
 * @example
 * ```ts
 * xJet.useFakeTimers();
 * Promise.resolve().then(() => console.log('promise done'));
 * setTimeout(() => console.log('timeout done'), 0);
 * await xJet.runAllTimersAsync();
 * // Logs:
 * // promise done
 * // timeout done
 * ```
 *
 * @since 1.3.0
 */

export async function runAllTimersAsync(): Promise<void> {
    await inject(TimerService).runAllTimersAsync();
}

/**
 * Asynchronous equivalent of {@link runOnlyPendingTimers}.
 *
 * @remarks
 * Yields to the event loop before running only timers that are currently pending.
 * Any timers scheduled by those callbacks will not be executed until a later call.
 *
 * @example
 * ```ts
 * useFakeTimers();
 * setTimeout(() => {
 *   console.log('first');
 *   setTimeout(() => console.log('second'), 100);
 * }, 100);
 * await runOnlyPendingTimersAsync();
 * // Logs only "first"
 * ```
 *
 * @since 1.3.0
 */

export async function runOnlyPendingTimersAsync(): Promise<void> {
    await inject(TimerService).runOnlyPendingTimersAsync();
}
