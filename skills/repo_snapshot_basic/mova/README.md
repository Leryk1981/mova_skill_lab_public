# MOVA overlays for `skill.repo_snapshot_basic`

This folder contains local MOVA definitions for the skill:

- `ds/` – local data schemas:
  - `ds.repo_snapshot_request_v1.schema.json` – input schema describing raw repository data
  - `ds.repo_snapshot_result_v1.schema.json` – output schema with snapshot markdown, memory summary, and checklist

- `env/` – local envelopes:
  - `env.repo_snapshot_run_v1.schema.json` – envelope for running the snapshot skill

