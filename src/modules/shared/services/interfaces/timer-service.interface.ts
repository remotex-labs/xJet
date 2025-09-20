/**
 * Interface representing a single timer stored and executed by the {@link TimerService}.
 *
 * @remarks
 * This interface tracks all properties needed to manage both one-time
 * and repeating timers within the fake timer system.
 *
 * @example
 * ```ts
 * const timer: TimerInterface = {
 *   id: 1,
 *   time: 1000,
 *   args: [],
 *   callback: () => console.log('done'),
 *   interval: null,
 * };
 * ```
 *
 * @since 1.1.0
 */

export interface TimerInterface {
    /**
     * Unique identifier for the timer.
     * @since 1.1.0
     */

    id: number;

    /**
     * The simulated timestamp (in milliseconds) when the timer is next due to run.
     * @since 1.1.0
     */

    time: number;

    /**
     * Arguments passed to the timer's callback function.
     * @since 1.1.0
     */

    args: Array<unknown>;

    /**
     * Callback function to execute when the timer triggers.
     * @since 1.1.0
     */

    callback: () => void;

    /**
     * Interval in milliseconds for repeating timers.
     * `null` indicates a one-time timer (like `setTimeout`), otherwise behaves like `setInterval`.
     *
     * @since 1.1.0
     */

    interval: number | null;
}
