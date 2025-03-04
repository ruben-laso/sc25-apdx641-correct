/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { wait } from '../__fixtures__/wait.js'
import * as gcf from '../__fixtures__/functions.js'
import * as cp from '../__fixtures__/child_process'
import { Cache } from '../src/cache.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/wait.js', () => ({ wait }))
jest.unstable_mockModule('../src/functions.js', () => gcf)
jest.unstable_mockModule('child_process', () => cp)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

const cache = new Cache('./tmp')

let output = {
  task_id: 't1',
  status: 'success',
  result: 'res',
  completion_t: '1',
  exception: 'ex',
  details: {}
}
describe('main.ts', () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation(function (name: string): string {
      if (name === 'client-id') {
        return '1'
      } else if (name === 'client-secret') {
        return '2'
      } else if (name === 'endpoint-uuid') {
        return '3'
      } else if (name === 'function-uuid') {
        return '4'
      } else if (name === 'args') {
        return '[]'
      } else {
        return '{}'
      }
    })

    gcf.getToken.mockImplementation(() =>
      Promise.resolve({
        access_token: '1',
        scope: 'scope',
        resource_server: 'rs',
        expires_in: 1,
        other_tokens: []
      })
    )

    gcf.submit_tasks.mockImplementation(() =>
      Promise.resolve({
        request_id: 'ri1',
        task_group_id: 'tg1',
        endpoint_id: 'euuid',
        tasks: { t: ['task1'] }
      })
    )

    gcf.check_status.mockImplementation(() => Promise.resolve(output))

    // Mock the wait function so that it does not actually wait.
    wait.mockImplementation(() => Promise.resolve('done!'))

    cp.execSync.mockReturnValueOnce('res')
  })

  afterEach(() => {
    jest.resetAllMocks()

    cache.remove('access-token')
  })

  it('Check that main function runs with inputs', async () => {
    cp.execSync.mockReset()
    cp.execSync.mockReturnValue(output.result)
    await run()
    expect(core.setOutput).toHaveBeenCalledWith('response', output)
    expect(core.setOutput).toHaveBeenCalledWith('result', output.result)
  })

  it('Add coverage for JSON output types', async () => {
    let result = JSON.stringify({ stdout: 'stdout' })
    cp.execSync.mockReset()
    cp.execSync.mockReturnValue(result)
    await run()
    expect(core.setOutput).toHaveBeenCalledWith('response', output)
    expect(core.setOutput).toHaveBeenCalledWith('result', result)

    result = JSON.stringify({ stderr: 'stderr' })
    cp.execSync.mockReset()
    cp.execSync.mockReturnValue(result)
    await run()
    expect(core.setOutput).toHaveBeenCalledWith('response', output)
    expect(core.setOutput).toHaveBeenCalledWith('result', result)
  })

  it('Check that error is raised in case of nonzero returncode', async () => {
    const result = JSON.stringify({ stdout: 'stdout', returncode: 2 })
    cp.execSync.mockReset()
    cp.execSync.mockReturnValue(result)
    await run()

    expect(core.setFailed).toHaveBeenCalledWith(Error('stdout'))
  })

  it("Check that output result isn't deserialized when task fails", async () => {
    output = {
      task_id: 't1',
      status: 'failed',
      result: 'res',
      completion_t: '1',
      exception: 'ex',
      details: {}
    }

    await run()
    expect(core.setOutput).toHaveBeenCalledWith('response', output)
    expect(core.setOutput).toHaveBeenCalledWith('result', '')
  })

  it('Remove cache and unset getToken mock', async () => {
    // cache.set('access-token', 2)
    gcf.getToken
      .mockClear()
      .mockRejectedValueOnce(new Error('function execution did not pass'))
    await run()
    expect(core.setFailed).toHaveBeenCalledWith(
      Error('function execution did not pass')
    )
  })
})
