# MOVA overlays for `skill.repo_code_change_plan_basic`

This folder contains local MOVA definitions for the skill:

- `ds/` – local data schemas:
  - `ds.repo_change_plan_request_v1.schema.json` – input schema with repository snapshot, goal summary, and constraints
  - `ds.repo_change_plan_result_v1.schema.json` – output schema with structured, step-by-step change plan

- `env/` – local envelopes:
  - `env.repo_change_plan_run_v1.schema.json` – envelope for generating a code change plan

