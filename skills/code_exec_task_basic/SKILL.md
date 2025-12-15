# skill.code_exec_task_basic

## Purpose

A basic infrastructural skill that standardizes how CLI commands are executed in a repository. It provides a unified contract for running commands, capturing results (exit code, stdout/stderr, duration), and generating human-readable summaries.

## What This Skill Does

- **Describes** what command to run and where (working directory, command arguments)
- **Executes** the command via runtime binding (actual process execution)
- **Captures** execution results (exit code, stdout, stderr, duration)
- **Formats** results into a human-readable markdown summary

## What This Skill Does NOT Do

- **Does not edit code** – this skill only executes commands, it does not modify files
- **Does not build change plans** – it does not plan what code changes to make
- **Does not deploy** – it can run deployment commands, but does not orchestrate deployments
- **Does not make decisions** – it executes what it's told and reports results

## Typical Scenario

1. **Agent/human forms request**: Create a `ds.code_exec_request_v1` with:
   - Command to run (e.g., `["npm", "test"]`)
   - Working directory (e.g., `"."` or `"packages/worker"`)
   - Timeout and other parameters

2. **Skill executes via binding**: The runtime binding spawns the process, captures output, and handles timeouts

3. **LLM formats summary**: The prompt profile generates `summary_md` and optional `notes_for_next_step`

4. **Result is returned**: `ds.code_exec_result_v1` with all execution details and formatted summary

5. **Episode can be recorded**: The result can be stored as an episode in the genetic layer for later analysis

## Example Commands

This skill can execute any CLI command:

- **Testing**: `["npm", "test"]`, `["npm", "run", "test:unit"]`
- **Validation**: `["npm", "run", "validate"]`, `["npx", "tsc", "--noEmit"]`
- **Build**: `["npm", "run", "build"]`, `["npx", "webpack"]`
- **Deploy**: `["npx", "wrangler", "deploy"]`, `["npm", "run", "deploy:prod"]`
- **Linting**: `["npx", "eslint", "."]`, `["npm", "run", "lint"]`

## MOVA Contracts

- **Input**: `ds.code_exec_request_v1` (via `env.code_exec_run_v1`)
- **Output**: `ds.code_exec_result_v1` (via `env.code_exec_run_v1`)
- **Verb**: `transform` (transforming a command request into an execution result)
- **Resource**: `code_exec_task`

## Runtime Binding

The skill uses a `local_script` runtime binding that:

- Resolves `working_dir` to an absolute path
- Spawns a process with `command_argv`
- Captures stdout/stderr with `timeout_ms` and `capture_max_kb` limits
- Returns exit code, duration, and captured output
- Applies `env_overrides` to the process environment
- Handles `allow_nonzero_exit` flag

The actual implementation should be in `tools/run_code_exec.js` or equivalent runtime handler.

## Episode Policy

The skill uses `episode_policy.mode: "on_error"` to record episodes when execution fails or times out, enabling debugging and learning from failures.

## Relationship to Other Skills

This skill complements the scaffolding pipeline:

- `skill.connector_scaffolder_basic` → creates MOVA connector structure
- `skill.runtime_binding_code_scaffolder_basic` → generates code skeleton
- `skill.code_exec_task_basic` → **executes the generated code** (tests, builds, deploys)

Together, they form a complete chain:
**"API description → MOVA connector → code binding → standardized code execution"**

