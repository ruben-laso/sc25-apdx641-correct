/**
 * Waits for a number of milliseconds.
 *
 * @param milliseconds The number of milliseconds to wait.
 * @returns Resolves with 'done!' after the wait is over.
 */
export declare function wait(milliseconds: number): Promise<string>;
/**
 * Exponentially increasing wait time.
 *
 * @returns Resolves with 'done!' after the wait is over.
 */
export declare function exponential_decay(): Promise<string>;
