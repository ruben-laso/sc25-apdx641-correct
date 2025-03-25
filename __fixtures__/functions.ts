import { jest } from '@jest/globals'

export const getToken = jest.fn<typeof import('../src/functions.js').getToken>()
export const submit_tasks =
  jest.fn<typeof import('../src/functions.js').submit_tasks>()
export const check_status =
  jest.fn<typeof import('../src/functions.js').check_status>()
export const register_function =
  jest.fn<typeof import('../src/functions.js').register_function>()
