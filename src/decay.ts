import { START_TIME } from './constants.js'
import { wait as wait } from './wait.js'

/**
 * Exponentially increasing wait time.
 *
 * @returns Resolves with 'done!' after the wait is over.
 */
export async function exponential_decay(): Promise<string> {
  const runtime = Date.now() - START_TIME
  let delay = 0

  if (runtime < 5000) {
    // less than 5s
    delay = 5000
  } else if (runtime < 60000) {
    // less than 1m
    delay = 15000
  } else if (runtime < 600000) {
    // less than 10m
    delay = 30000
  } else if (runtime < 3600000) {
    // less than 1hr
    delay = 60000
  } else {
    delay = 300000
  }
  return wait(delay) // greater than 1hr
}
