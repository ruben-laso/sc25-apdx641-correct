# Globus Compute GitHub Action

[![GitHub Super-Linter](https://github.com/ValHayot/globus-compute-github-action/actions/workflows/linter.yml/badge.svg)](https://github.com/ValHayot/globus-compute-github-action/actions/workflows/linter.yml)
[![CI](https://github.com/ValHayot/globus-compute-github-action/actions/workflows/ci.yml/badge.svg)](https://github.com/ValHayot/globus-compute-github-action/actions/workflows/ci.yml)
[![Check dist/](https://github.com/ValHayot/globus-compute-github-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/ValHayot/globus-compute-github-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/ValHayot/globus-compute-github-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/ValHayot/globus-compute-github-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

> [!WARNING] Action is under active development.

## Introduction

This action aims to allow users to execute their jobs (and by extension, CI
flows) on
[Globus Compute](https://globus-compute.readthedocs.io/en/stable/sdk.html)
Endpoints within their GitHub Action workflows.

Users are responsible for setting up their own Globus Compute Endpoints that
will be used by the action. Furthermore, to bypass manual authentication within
the action, it is necessary that the endpoints and the action are both
configured to use a `GLOBUS_COMPUTE_CLIENT_ID` and
`GLOBUS_COMPUTE_CLIENT_SECRET`
([docs](https://globus-compute.readthedocs.io/en/stable/sdk.html#client-credentials-with-clients)).

## Usage

> [!Caution] Not currently published to the action marketplace.

Using the action in a workflow can be done by adding the following step.

```yaml
- name: Run task on Globus Compute Endpoint
  id: gc-action
  uses: actions/globus-compute-action@v1
  with:
    client_id: ${{ secret.GLOBUS_COMPUTE_CLIENT_ID }}
    client_secret: ${{ secret.GLOBUS_COMPUTE_CLIENT_SECRET }}
    endpoint_uuid: <Globus Compute Endpoint UUID>
    function_uuid: <Registered Globus Compute function UUID>
    args: <List of arguments to pass to task>
    kwargs: <Dictionary of keyword arguments>
```

### Example

```yaml
 - name: Run GC Action
        id: gc-action
        uses: actions/globus-compute-action@v1
        with:
          client_id: ${{ secrets.GLOBUS_COMPUTE_CLIENT_ID }}
          client_secret: ${{ secrets.GLOBUS_COMPUTE_CLIENT_SECRET }}
          endpoint_uuid: 'f8e95115-0d66-41fe-88d8-ecf8c3bf59fd'
          function_uuid: '02ea7614-be2e-4df0-9d23-643b6d8a6499'
          args: '[]'
          kwargs: '{"inpt": "test"}'
```

### Obtaining task execution outputs

The output of the execution of a GC task is returned as a JSON dictionary via
the `steps.<step_id>.outputs.output` variable. For example, a job defined as
follows:

```yaml
- name: Run GC Action
  id: gc-action
  uses: actions/globus-compute-action@v1
  with:
    client_id: ${{ secrets.GLOBUS_CLI_CLIENT_ID }}
    client_secret: ${{ secrets.GLOBUS_CLI_CLIENT_SECRET }}
    endpoint_uuid: 'f8e95115-0d66-41fe-88d8-ecf8c3bf59fd'
    function_uuid: '02ea7614-be2e-4df0-9d23-643b6d8a6499'
    args: '[]'
    kwargs: '{"inpt": "test"}'
- name: Print Output
  id: output
  run: echo "${{ steps.gc-action.outputs.output }}"
```

May return the following output:

```bash
{
  task_id: '35363d35-a3a9-4db7-bc46-4a8d92941188',
  status: 'success',
  result: '00\ngASVEwAAAAAAAAB9lIwEaW5wdJSMBXdvcmxklHMu\n',
  completion_t: '1738514959.424744',
  details: {
    os: 'macOS-15.0.1-arm64-arm-64bit',
    dill_version: '0.3.9',
    python_version: '3.12.0',
    globus_compute_sdk_version: '3.0.1',
    endpoint_id: 'f8e95115-0d66-41fe-88d8-ecf8c3bf59fd',
    task_transitions: {
      'execution-start': 1738514959.122622,
      'execution-end': 1738514959.14045
    }
  }
}
```

<!--
1. Commit your changes

   ```bash
   git add .
   git commit -m "My first action is ready!"
   ```

1. Push them to your repository

   ```bash
   git push -u origin releases/v1
   ```

1. Create a pull request and get feedback on your action
1. Merge the pull request into the `main` branch

Your action is now published! :rocket:

For information about versioning your action, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.

## Validate the Action

You can now validate the action by referencing it in a workflow file. For
example, [`ci.yml`](./.github/workflows/ci.yml) demonstrates how to reference an
action in the same repository.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Test Local Action
    id: test-action
    uses: ./
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

For example workflow runs, check out the
[Actions tab](https://github.com/actions/typescript-action/actions)! :rocket:

## Usage

After testing, you can create version tag(s) that developers can use to
reference different stable versions of your action. For more information, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.

To include the action in a workflow in another repository, you can use the
`uses` syntax with the `@` symbol to reference a specific branch, tag, or commit
hash.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Test Local Action
    id: test-action
    uses: actions/typescript-action@v1 # Commit with the `v1` tag
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

## Publishing a New Release

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. This script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent SemVer release tag of the current branch, by looking at the local data
   available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the tag retrieved in
   the previous step, and validates the format of the inputted tag (vX.X.X). The
   user is also reminded to update the version field in package.json.
1. **Tagging the new release:** The script then tags a new release and syncs the
   separate major tag (e.g. v1, v2) with the new release tag (e.g. v1.0.0,
   v2.1.2). When the user is creating a new major release, the script
   auto-detects this and creates a `releases/v#` branch for the previous major
   version.
1. **Pushing changes to remote:** Finally, the script pushes the necessary
   commits, tags and branches to the remote repository. From here, you will need
   to create a new release in GitHub so users can easily reference the new tags
   in their workflows. -->
