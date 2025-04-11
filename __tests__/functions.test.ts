import { jest } from '@jest/globals'
import { v4 as uuidv4 } from 'uuid'
import { wait } from '../__fixtures__/wait.js'
import {
  getToken,
  submit_tasks,
  check_status,
  register_function
} from '../src/functions.js'
import {
  TaskStatusResponse,
  TaskSubmission,
  Token,
  RegisterResponse
} from '../src/interfaces.js'
import { execSync } from 'child_process'
//import { Token, TaskStatusResponse, TaskSubmission } from '../src/interfaces.js'

jest.unstable_mockModule('../src/wait.js', () => ({ wait }))

const TokenResponse: Token = {
  access_token: 'a111',
  resource_server: 'rs',
  scope: 'test_scope',
  expires_in: 100,
  other_tokens: []
}

const InvalidTaskSubmissionResponse: TaskSubmission = {
  request_id: 'r111',
  task_group_id: 'tgi-456',
  endpoint_id: 'eid-2',
  tasks: { function1: ['task1', 'task2'] }
}

const StatusResponse: TaskStatusResponse = {
  task_id: 'tid111',
  status: 'success',
  result: 'Operation successful',
  completion_t: '100',
  exception: 'Failed task',
  details: {}
}

const MockRegResponse: RegisterResponse = {
  function_uuid: '1234'
}

const failedText = 'The fetch operation was unsuccessful.'

describe('functions.ts', () => {
  beforeAll(() => {
    execSync('pip install globus-compute-sdk')
  })

  beforeEach(() => {
    wait.mockImplementation(() => Promise.resolve('done!'))

    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      if (typeof callback === 'function') {
        callback()
      }
      return { hasRef: () => false } as NodeJS.Timeout
    })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  const endpoint_uuid = uuidv4()
  const function_uuid = uuidv4()
  const ValidTaskSubmissionResponse: TaskSubmission = {
    request_id: 'r111',
    task_group_id: 'tgi-456',
    endpoint_id: endpoint_uuid,
    tasks: { function_uuid: ['task1', 'task2'] }
  }

  it('successful call getToken', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(TokenResponse),
        text: () => Promise.resolve('Success')
      } as Response)
    )

    const token = await getToken('123', 'abc')
    expect(token).toBe(TokenResponse)
  })

  it('failed call getToken', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve(TokenResponse),
        text: () => Promise.resolve(failedText)
      } as Response)
    )

    let err
    try {
      await getToken('123', 'abc')
    } catch (error) {
      err = error
    }
    expect(err).toStrictEqual(Error(failedText))
  })
  it('Successful call to submit_tasks', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(ValidTaskSubmissionResponse),
        text: () => Promise.resolve('Success')
      } as Response)
    )

    const endpoint_config = {}

    let sub_response = await submit_tasks(
      'a111',
      endpoint_uuid,
      endpoint_config,
      {},
      function_uuid,
      '[]',
      '{}'
    )
    expect(sub_response).toBe(ValidTaskSubmissionResponse)

    // add serialized args and test for coverage here
    sub_response = await submit_tasks(
      'a111',
      endpoint_uuid,
      endpoint_config,
      {},
      function_uuid,
      '[]',
      '{}'
    )
    expect(sub_response).toBe(ValidTaskSubmissionResponse)

    // with user_endpoint_config
    sub_response = await submit_tasks(
      'a111',
      endpoint_uuid,
      { min_blocks: 0, max_blocks: 1 },
      {},
      function_uuid,
      '[]',
      '{}'
    )
    expect(sub_response).toBe(ValidTaskSubmissionResponse)

    // with resource_specification
    sub_response = await submit_tasks(
      'a111',
      endpoint_uuid,
      endpoint_config,
      { num_nodes: 2 },
      function_uuid,
      '[]',
      '{}'
    )
    expect(sub_response).toBe(ValidTaskSubmissionResponse)
  })
  it('Failed call to submit_tasks', async () => {
    const endpointFailedText = 'Endpoint UUID eid2 is not a valid UUID'
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve(InvalidTaskSubmissionResponse),
        text: () => Promise.resolve(failedText)
      } as Response)
    )

    let err
    try {
      await submit_tasks('a111', 'eid2', {}, {}, 'func_id', '[]', '{}')
    } catch (error) {
      err = error
    }
    expect(err).toStrictEqual(Error(endpointFailedText))

    const functionFailedText = 'Function UUID func_id is not a valid UUID'
    try {
      await submit_tasks(
        'a111',
        ValidTaskSubmissionResponse.endpoint_id,
        {},
        {},
        'func_id',
        '[]',
        '{}'
      )
    } catch (error) {
      err = error
    }
    expect(err).toStrictEqual(Error(functionFailedText))

    try {
      await submit_tasks(
        'a111',
        ValidTaskSubmissionResponse.endpoint_id,
        {},
        {},
        function_uuid,
        '[]',
        '{}'
      )
    } catch (error) {
      err = error
    }
    expect(err).toStrictEqual(Error(failedText))
  })

  it('Successful call to check_status', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(StatusResponse),
        text: () => Promise.resolve('Success')
      } as Response)
    )

    const status_response = await check_status('at01', 'tu123')
    expect(status_response).toBe(StatusResponse)
  })

  it('Failed call to check_status', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve(StatusResponse),
        text: () => Promise.resolve(failedText)
      } as Response)
    )

    let err
    try {
      await check_status('at01', 'tu123')
    } catch (error) {
      err = error
    }
    expect(err).toStrictEqual(Error(failedText))
  })
  it('waiting for ep check_status', async () => {
    const sr: TaskStatusResponse = {
      task_id: 'testing',
      status: 'waiting-for-ep',
      result: 'Operation successful',
      completion_t: '100',
      exception: 'Failed task',
      details: {}
    }
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sr),
        text: () => Promise.resolve(failedText)
      } as Response)
    )

    const resp = await check_status('at01', 'tu123')
    expect(resp.status).toStrictEqual('waiting-for-ep')
  }, 6000)

  it('Failed task status', async () => {
    const sr: TaskStatusResponse = {
      task_id: 'testing',
      status: 'failed',
      result: 'Operation successful',
      completion_t: '100',
      exception: 'Failed task',
      details: {}
    }
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sr),
        text: () => Promise.resolve(failedText)
      } as Response)
    )

    let err
    try {
      await check_status('at01', 'tu123')
    } catch (error) {
      err = error
    }
    expect(err).toStrictEqual(Error(sr.exception))
  })

  it('Successful call to register_function', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MockRegResponse),
        text: () => Promise.resolve('Success')
      } as Response)
    )

    const reg_response = await register_function('at', 'at01')
    expect(reg_response).toBe(MockRegResponse)
  })
  it('Failed registration', async () => {
    const failed_reg = {
      status: 'Unauthorized',
      code: '401',
      error_args: [],
      http_status_code: 401,
      reason: 'Unauthorized'
    }
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve(failed_reg),
        text: () => Promise.resolve(failed_reg.status)
      } as Response)
    )

    let err
    try {
      await register_function('at', '1234')
    } catch (error) {
      err = error
    }
    expect(err).toStrictEqual(Error(failed_reg.status))
  })
})
