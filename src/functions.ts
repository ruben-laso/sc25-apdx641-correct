import { Token, TaskStatusResponse, TaskSubmission } from './interfaces.js'
import { wait } from './wait.js'
import { Buffer } from 'buffer'

/**
 * Retrieve bearer tokens from Globus Auth
 *
 * @param CLIENT_ID:  The Globus Client ID to use
 * @param CLIENT_SECRET: The secret associated with the Globus Client ID
 * @returns TokenResponse information returned by Globus Auth
 *
 */
export function getToken(
  CLIENT_ID: string,
  CLIENT_SECRET: string
): Promise<Token> {
  const token_fmt: string = `${CLIENT_ID}:${CLIENT_SECRET}`
  const basic_token: string = Buffer.from(token_fmt, 'utf-8').toString('base64')

  const gcscope: string =
    'https://auth.globus.org/scopes/facd7ccc-c5f4-42aa-916b-a0e270e2c2a9/all'
  const gcgrant_type: string = 'client_credentials'

  const headers: Headers = new Headers()
  headers.set('Content-Type', 'application/x-www-form-urlencoded')
  headers.set('Authorization', `Basic ${basic_token}`)

  const url: URL = new URL('/v2/oauth2/token', 'https://auth.globus.org')
  url.search = new URLSearchParams({
    scope: gcscope,
    grant_type: gcgrant_type
  }).toString()

  const request: Request = new Request(url, {
    method: 'POST',
    headers: headers
  })

  return fetch(request)
    .then((res) => {
      if (res.ok) {
        return res.json()
      }
      return res.text().then((text) => {
        throw new Error(text)
      })
    })
    .then((res) => {
      return res as Token
    })
}

/**
 * Submit functions with given arguments to the specified Globus Compute Endpoint
 *
 * @param access_token : Globus Auth bearer token
 * @param endpoint_uuid : Globus Compute Endpoint to send tasks to
 * @param function_uuid  : Globus Compute registered function UUID
 * @param args : Arguments to provide to tasks
 * @param kwargs : Keyword arguments to provide to task
 * @returns Task submission response returned by Globus Compute
 *
 */
export function submit_tasks(
  access_token: string,
  endpoint_uuid: string,
  function_uuid: string,
  args: string,
  kwargs: string
): Promise<TaskSubmission> {
  const size_args: number = args.length + 4
  const size_kwargs: number = kwargs.length + 5

  const headers: Headers = new Headers()
  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${access_token}`)

  const body: object = {
    create_queue: false,
    tasks: {
      [function_uuid]: [
        `${size_args}\n11\n${args}\n${size_kwargs}\n11\n${kwargs}\n`
      ]
    }
  }

  const content_len = JSON.stringify(body).length
  const url: URL = new URL(
    `/v3/endpoints/${endpoint_uuid}/submit`,
    'https://compute.api.globus.org'
  )
  url.search = new URLSearchParams({
    endpoint_uuid: endpoint_uuid,
    'content-length': content_len.toString()
  }).toString()

  const request: Request = new Request(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  })

  return fetch(request)
    .then((res) => {
      if (res.ok) {
        return res.json()
      }
      return res.text().then((text) => {
        throw new Error(text)
      })
    })
    .then((res) => {
      return res as TaskSubmission
    })
}

/**
 * Check the status of a running task
 *
 * @param access_token : Globus Auth bearer token
 * @param task_uuid : Task UUID of running Globus Compute task
 * @returns TaskStatusResponse returned by Globus Compute
 */
export function check_status(
  access_token: string,
  task_uuid: string
): Promise<TaskStatusResponse> {
  const headers: Headers = new Headers()
  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${access_token}`)

  const url: URL = new URL(
    `/v2/tasks/${task_uuid}`,
    'https://compute.api.globus.org'
  )

  const request: Request = new Request(url, {
    method: 'GET',
    headers: headers
  })

  const wait_for_ep = async function (): Promise<TaskStatusResponse> {
    while (true) {
      const response: Response = await fetch(request)
      if (!response.ok) {
        throw new Error(await response.text())
      }

      const results: TaskStatusResponse =
        (await response.json()) as TaskStatusResponse

      if (results.status === 'waiting-for-ep') {
        await wait(1000)

        // just to enable testing.
        if (results.task_id === 'testing') {
          return results
        }
      } else if (results.status === 'failed') {
        throw new Error(results.exception)
      } else {
        return results
      }
    }
  }
  return wait_for_ep()
}
