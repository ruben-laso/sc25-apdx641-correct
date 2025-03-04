import { Token, TaskStatusResponse, TaskSubmission } from './interfaces.js';
export declare function getToken(CLIENT_ID: string, CLIENT_SECRET: string): Promise<Token>;
export declare function submit_tasks(access_token: string, endpoint_uuid: string, function_uuid: string, args: string, kwargs: string): Promise<TaskSubmission>;
export declare function check_status(access_token: string, task_uuid: string): Promise<TaskStatusResponse>;
