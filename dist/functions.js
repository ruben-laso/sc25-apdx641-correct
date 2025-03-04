import { wait } from './wait.js';
export function getToken(CLIENT_ID, CLIENT_SECRET) {
    var token_fmt = `${CLIENT_ID}:${CLIENT_SECRET}`;
    var basic_token = btoa(token_fmt);
    const gcscope = 'https://auth.globus.org/scopes/facd7ccc-c5f4-42aa-916b-a0e270e2c2a9/all';
    const gcgrant_type = 'client_credentials';
    const headers = new Headers();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    headers.set('Authorization', `Basic ${basic_token}`);
    var url = new URL('/v2/oauth2/token', 'https://auth.globus.org');
    url.search = new URLSearchParams({
        scope: gcscope,
        grant_type: gcgrant_type
    }).toString();
    const request = new Request(url, {
        method: 'POST',
        headers: headers
    });
    return fetch(request)
        .then((res) => res.json())
        .then((res) => {
        return res;
    });
}
export function submit_tasks(access_token, endpoint_uuid, function_uuid, args, kwargs) {
    var size_args = args.length + 4;
    var size_kwargs = kwargs.length + 5;
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${access_token}`);
    var body = {
        create_queue: false,
        tasks: {
            [function_uuid]: [
                `${size_args}\n11\n${args}\n${size_kwargs}\n11\n${kwargs}\n`
            ]
        }
    };
    var content_len = JSON.stringify(body).length;
    var url = new URL(`/v3/endpoints/${endpoint_uuid}/submit`, 'https://compute.api.globus.org');
    url.search = new URLSearchParams({
        endpoint_uuid: endpoint_uuid,
        'content-length': content_len.toString()
    }).toString();
    const request = new Request(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    return fetch(request)
        .then((res) => {
        if (res.ok) {
            return res.json();
        }
        return res.text().then((text) => {
            throw new Error(text);
        });
    })
        .then((res) => {
        return res;
    });
}
export function check_status(access_token, task_uuid) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${access_token}`);
    var url = new URL(`/v2/tasks/${task_uuid}`, 'https://compute.api.globus.org');
    const request = new Request(url, {
        method: 'GET',
        headers: headers
    });
    var wait_for_ep = async function () {
        while (true) {
            const response = await fetch(request);
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const results = (await response.json());
            if (results.status === 'waiting-for-ep') {
                await wait(5000);
            }
            else {
                return results;
            }
        }
    };
    wait_for_ep();
    return wait_for_ep();
}
//# sourceMappingURL=functions.js.map