import type * as cp from 'child_process'
import { jest } from '@jest/globals'

export const execSync = jest.fn<typeof cp.execSync>()
