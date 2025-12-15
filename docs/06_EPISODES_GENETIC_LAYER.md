# Episodes and genetic layer – draft

Episodes are structured records of how envelopes were actually executed.

- Each episode references:

  - which `env.*` was executed,

  - which skill (if any) it belonged to,

  - input / output data,

  - status and timing,

  - who executed it (human / agent / tool).

All episodes should be valid against a shared episode schema

in `core/mova/ds/` (to be added later).

Per-skill episodes will live under `skills/<skill_id>/episodes/`

and can be aggregated into genetic analytics later.

The shared episode schema in this lab is:

- `core/mova/ds/ds.episode_v1.schema.json`

All skills are expected to write their `episodes/*.json` in this format.

## Episode policies

Not every skill needs to produce an episode for every run.

The `ds.episode_policy_v1` schema allows each skill to describe how episodes

should be recorded:

- `mode = "none"` – do not record episodes automatically.

- `mode = "on_error"` – record episodes only for failed runs.

- `mode = "sampled"` – record a subset of runs (for example based on sampling).

- `mode = "full"` – record every run as an episode.

The policy is referenced from `ds.skill_descriptor_v1` as the `episode_policy`

field. Runtime tools (such as runners) can read this field and decide whether

to persist an episode for a given run.

