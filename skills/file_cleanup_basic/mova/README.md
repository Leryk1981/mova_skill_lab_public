# MOVA overlays for `skill.file_cleanup_basic`

This folder contains local MOVA definitions for the skill:

- `ds/` – local data schemas:
  - `ds.file_cleanup_request_v1.schema.json` – input schema describing disk snapshot and user preferences
  - `ds.file_cleanup_result_v1.schema.json` – output schema with structured cleanup plan

- `env/` – local envelopes:
  - `env.file_cleanup_run_v1.schema.json` – envelope for running the cleanup skill

