import * as core from '@actions/core'
import { Token } from './interfaces.js'
import { getToken, submit_tasks, check_status } from './functions.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const CLIENT_ID: string = core.getInput('client_id')
    const CLIENT_SECRET: string = core.getInput('client_secret')
    const endpoint_uuid: string = core.getInput('endpoint_uuid')
    const function_uuid: string = core.getInput('function_uuid')

    const args: string = core.getInput('args')
    const kwargs: string = core.getInput('kwargs')

    const token: Token = await getToken(CLIENT_ID, CLIENT_SECRET)
    const batch_res = await submit_tasks(
      token.access_token,
      endpoint_uuid,
      function_uuid,
      args,
      kwargs
    )
    const keys: string = Object.keys(batch_res.tasks)[0]
    const task_uuid: string = batch_res.tasks[keys as keyof object][0]
    const result = await check_status(token.access_token, task_uuid)
    console.log(result)
    core.setOutput('output', result)
  } catch (error) {
    core.setFailed(error as Error)
  }
}
