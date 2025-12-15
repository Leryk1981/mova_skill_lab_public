# MOVA overlays for `skill.code_exec_task_basic`

This folder contains local MOVA definitions for the skill:

- `ds/` – local data schemas:
  - `ds.code_exec_request_v1.schema.json` – input schema describing a CLI command to execute (working directory, command arguments, timeout, env overrides)
  - `ds.code_exec_result_v1.schema.json` – output schema with execution results (exit code, stdout/stderr, duration, summary)

- `env/` – local envelopes:
  - `env.code_exec_run_v1.schema.json` – envelope for executing a CLI command and returning a standardized result

