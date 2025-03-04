import * as core from '@actions/core';
import { getToken, submit_tasks, check_status } from './functions.js';
/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run() {
    try {
        const CLIENT_ID = core.getInput('client-id'); // "462577f6-b2cb-4c73-9d74-58e65bd59ea8"
        const CLIENT_SECRET = core.getInput('client-secret'); // "Kuw/GTaTHyl4NPNbOSkSkT9wr18eiKz+65mSen2XexI="
        const endpoint_uuid = core.getInput('endpoint-uuid'); // "f8e95115-0d66-41fe-88d8-ecf8c3bf59fd"
        const function_uuid = core.getInput('function-uuid'); // "02ea7614-be2e-4df0-9d23-643b6d8a6499"
        var args = core.getInput('args'); //JSON.stringify([])
        var kwargs = core.getInput('kwargs'); //JSON.stringify({inpt: "worldi!"})
        var token = await getToken(CLIENT_ID, CLIENT_SECRET);
        var batch_res = await submit_tasks(token.access_token, endpoint_uuid, function_uuid, args, kwargs);
        var keys = Object.keys(batch_res.tasks)[0];
        var task_uuid = batch_res.tasks[keys][0];
        var result = await check_status(token.access_token, task_uuid);
        core.setOutput('result', result.result);
        // getToken(CLIENT_ID, CLIENT_SECRET).then(function (token_result: Token) {
        //   submit_tasks(
        //     token_result.access_token,
        //     endpoint_uuid,
        //     function_uuid,
        //     args,
        //     kwargs
        //   ).then(function (batch_res) {
        //     var keys: string = Object.keys(batch_res.tasks)[0]
        //     var task_uuid: string = batch_res.tasks[keys as keyof object][0]
        //     check_status(token_result.access_token, task_uuid).then((res) =>
        //       core.setOutput('result', res.result)
        //     )
        //   })
        // })
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
//# sourceMappingURL=main.js.map