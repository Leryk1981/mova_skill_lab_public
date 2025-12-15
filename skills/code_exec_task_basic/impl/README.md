# Implementation for `skill.code_exec_task_basic`

This folder contains the green-layer implementation:

- `prompts/` – prompt profile for LLM-based summary formatting:
  - `code_exec_profile.md` – instructions for the LLM on how to format execution results into human-readable summaries

- `bindings/` – runtime binding definitions:
  - `code_exec_binding_v1.json` – local_script binding for actual command execution

The MOVA contracts for this skill are defined under `mova/`.

Implementation is free to change as long as it respects those contracts.

## Runtime bindings

The `bindings/` folder contains runtime binding definitions for this skill:

- Each `*.json` file is expected to follow `core/mova/ds/ds.skill_runtime_binding_v1.schema.json`.

- A binding describes **how** and **where** the skill is executed.

This skill uses a `local_script` runtime type, meaning it executes actual CLI commands via a Node.js script or equivalent runtime handler. The binding contract is:

1. Receive `ds.code_exec_request_v1` as input
2. Execute the command (spawn process, capture output, handle timeout)
3. Collect raw results (exit code, stdout, stderr, duration)
4. Pass results to LLM for summary formatting
5. Return `ds.code_exec_result_v1` with formatted summary

The actual implementation should be in `tools/run_code_exec.js` or equivalent runtime handler.

