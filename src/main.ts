import * as core from '@actions/core'
import { Token } from './interfaces.js'
import { getToken, submit_tasks, check_status } from './functions.js'
import { execSync } from 'child_process'

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
    const response = await check_status(token.access_token, task_uuid)

    core.setOutput('response', response)

    if (response.status === 'success') {
      const output = execSync(
        `python -c "from globus_compute_sdk.serialize.facade import ComputeSerializer; print(ComputeSerializer().deserialize('${response.result}'))"`,
        { encoding: 'utf-8' }
      )
      core.setOutput('result', output)
    } else {
      core.setOutput('result', '')
    }
  } catch (error) {
    core.setFailed(error as Error)
  }
}
