/**
 * Unit tests for src/wait.ts
 */
import { jest } from '@jest/globals'
import { exponential_decay } from '../src/decay.js'

describe('decay.ts', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks()
  })

  it('Test decay', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      if (typeof callback === 'function') {
        callback()
      }
      return { hasRef: () => false } as NodeJS.Timeout
    })

    let start = Date.now()
    await exponential_decay()
    jest.advanceTimersByTime(5001)
    let end = Date.now()
    expect(end - start).toBeGreaterThan(5000)

    start = Date.now()
    await exponential_decay()
    jest.advanceTimersByTime(59000)
    end = Date.now()
    expect(end - start).toBeGreaterThan(15000)

    start = Date.now()
    await exponential_decay()
    jest.advanceTimersByTime(590000)
    end = Date.now()
    expect(end - start).toBeGreaterThan(30000)

    start = Date.now()
    await exponential_decay()
    jest.advanceTimersByTime(3590000)
    end = Date.now()
    expect(end - start).toBeGreaterThan(60000)

    start = Date.now()
    await exponential_decay()
    jest.advanceTimersByTime(3600001)
    end = Date.now()
    expect(end - start).toBeGreaterThan(300000)
  })
})
