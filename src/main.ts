import * as core from '@actions/core'
import * as github from '@actions/github'
import { Token } from './interfaces.js'
import {
  getToken,
  submit_tasks,
  check_status,
  register_function
} from './functions.js'
import { execSync } from 'child_process'
import { Cache } from './cache.js'
import * as path from 'path'

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
    let function_uuid: string = core.getInput('function_uuid')
    const shell_cmd: string = core.getInput('shell_cmd')

    if (function_uuid === '' && shell_cmd === '') {
      throw Error('Either shell_cmd or function_uuid must be specified')
    }

    const args: string = core.getInput('args')
    const kwargs: string = core.getInput('kwargs')

    // install globus-compute-sdk if not already installed
    execSync(
      'gc_installed=$(pip freeze | grep globus-compute-sdk | wc -l) &&' +
        ' if [ ${gc_installed} -lt 1 ]; then pip install globus-compute-sdk; fi;'
    )

    const cache = new Cache(path.resolve('./tmp'))

    let access_token = await cache.get('access-token')

    if ((await cache.get('access-token')) == null) {
      console.log('Token not cached. Requesting new token')
      const token: Token = await getToken(CLIENT_ID, CLIENT_SECRET)
      await cache.set('access-token', token.access_token)
      access_token = token.access_token
    } else {
      console.log('Reusing existing token')
      access_token = await cache.get('access-token')
    }

    // Clone git repo with GC function
    const branch = github.context.ref
    const repo = github.context.repo

    const url = `${github.context.serverUrl}/${repo.owner}/${repo.repo}`
    console.log(`Cloning repo ${url}`)
    const cmd = `mkdir gc-action-temp; cd gc-action-temp; git clone ${url}; git checkout ${branch}`
    console.log('Registering function')
    const clone_reg = await register_function(access_token, cmd)
    const clone_uuid = clone_reg.function_uuid

    console.log(`Submitting function ${clone_uuid} to clone repo`)
    const sub_res = await submit_tasks(
      access_token,
      endpoint_uuid,
      clone_uuid,
      '',
      ''
    )
    console.log(`Received result ${sub_res}`)
    const clone_key: string = Object.keys(sub_res.tasks)[0]
    const clone_task: string = sub_res.tasks[clone_key as keyof object][0]
    console.log('Checking for results')
    await check_status(access_token, clone_task)

    //const cmd = `mkdir gc-action-temp; cd gc-action-temp; git clone ${}`

    if (shell_cmd.length !== 0) {
      const reg_response = await register_function(access_token, shell_cmd)
      function_uuid = reg_response.function_uuid
    }

    const batch_res = await submit_tasks(
      access_token,
      endpoint_uuid,
      function_uuid,
      args,
      kwargs
    )
    const keys: string = Object.keys(batch_res.tasks)[0]
    const task_uuid: string = batch_res.tasks[keys as keyof object][0]
    const response = await check_status(access_token, task_uuid)

    core.setOutput('response', response)

    if (response.status === 'success') {
      let data = response.result
      data = data.replace(/\n/g, '\\n')

      const output = execSync(
        `python -c 'import globus_compute_sdk; import json;` +
          ` data = globus_compute_sdk.serialize.concretes.DillDataBase64().deserialize("${data}");` +
          ` print(json.dumps({"stdout": data.stdout, "stderr": data.stderr, "cmd": data.cmd, "returncode": data.returncode})` +
          ` if hasattr(data, "stdout") else json.dumps(data).replace("\\n", ""), end="")'`,
        { encoding: 'utf-8' }
      )

      core.setOutput('result', output)

      const output_json = JSON.parse(output)

      if ('stdout' in output_json) {
        if ('returncode' in output_json && output_json['returncode'] != 0) {
          throw Error(output_json['stdout'])
        }
        console.log(output_json['stdout'])
      } else {
        console.log(output_json)
      }
      // json.dumps({"stdout": data.stdout.replace('\\\\n', '\\n'), "stderr": data.stderr, "cmd": data.cmd, "returncode": data.returncode}`
    } else {
      core.setOutput('result', '')
    }
  } catch (error) {
    core.setFailed(error as Error)
  }
}
