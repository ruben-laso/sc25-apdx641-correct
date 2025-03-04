import type * as fs from 'node:fs'
import { jest } from '@jest/globals'

export const readFileSync = jest.fn<typeof fs.readFileSync>()
export const writeFileSync = jest.fn<typeof fs.writeFileSync>()
