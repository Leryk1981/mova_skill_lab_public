# core/mova/ds – MOVA data schemas (red core)

This folder will contain shared `ds.*` schemas for the lab, including:

- an episode schema for genetic layer (e.g. `ds.episode_v1.json`),

- common structures (envelope header, shared meta),

- and any other cross-skill data types.

At bootstrap this folder is empty; schemas will be added in a dedicated task.

## Shared episode schema

This folder now contains a shared episode schema:

- `ds.episode_v1.schema.json` – common format for execution episodes.

All episode documents in the lab (for example under `skills/<skill_id>/episodes/`)

should be valid against this schema. Concrete envelopes define the shape of

`input` and `output` for their specific cases.

- `ds.skill_descriptor_v1.schema.json` – shared schema for skill manifests (`manifest.skill.json` in each skill).

- `ds.episode_policy_v1.schema.json` – shared policy for when episodes should be recorded.

- `ds.skill_run_request_v1.schema.json` – control-plane request describing which skill to run and how.

