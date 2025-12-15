# Tools – validation and utilities

This folder will contain small utilities for checking that

the repository still respects the MOVA Constitution, for example:

- `validate_mova_core.(ts|py)` – validate the red core schemas.

- `validate_skill.(ts|py)` – validate a given `skills/*` folder.

- `episode_lint.(ts|py)` – validate episode documents.

In this bootstrap step, only create this README. The actual

tools will be implemented in later tasks.

## Lab validation

The lab provides a Node/Ajv-based validator:

- Script: `tools/validate_lab.js`

- Run: `npm run validate`

What it checks:

- `lab/skills_registry_v1.json` against `ds.skill_registry_v1.schema.json`

- each `manifest.skill.json` against `ds.skill_descriptor_v1.schema.json`

- each runtime binding against `ds.skill_runtime_binding_v1.schema.json`

- each episode under `skills/<skill_id>/episodes/*.json` against `ds.episode_v1.schema.json`

## record_episode.js

`record_episode.js` is a small helper that creates a `ds.episode_v1` document

from a skill case:

- input: `skill_id` and a case file containing `envelope` and `expected_output`;

- output: a new episode JSON file in `skills/<skill_name>/episodes/`.

Example:

```bash

node tools/record_episode.js \

  --skill-id skill.context7_docs \

  --case-file skills/context7_docs/cases/context7_docs_ajv_draft2020_case_01.json

```

## run_skill_plan.js

`run_skill_plan.js` reads a `ds.skill_run_request_v1` JSON file, looks up the

skill in `lab/skills_registry_v1.json`, loads its manifest and `episode_policy`,

selects a binding, and prints a plan for the run (no real execution yet).

Example:

```bash

node tools/run_skill_plan.js \

  --request-file lab/skill_runs/context7_ajv_run_request_01.json

```

The output is a JSON object describing:

* which binding would be used (if any),

* how the episode recording mode is resolved (policy vs overrides).

