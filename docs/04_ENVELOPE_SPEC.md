# Envelope spec (env.*) – draft

Envelopes (`env.*`) are structured "speech-acts" over data:

- Each envelope has an `envelope_id` and a `verb`.

- It ties together roles, input data types, output data types, and meta.

The MOVA 4.0.0 core catalog includes an example envelope

`env.mova4_core_catalog_publish_v1` with verb `publish`. It publishes

a MOVA core catalog to an executor or registry.

In this bootstrap we only place stubs; concrete envelope schemas live

under `core/mova/env/` and will be populated later.

## Control-plane envelope: env.skill_run_v1

For running skills via the MOVA Skills Lab control plane we use a dedicated

envelope:

- `env.skill_run_v1` – envelope with:

  - `verb = "run"`,

  - `resource = "skill"`,

  - `input` referencing `ds.skill_run_request_v1`.

This separates the control-plane API (how we request a skill run) from the

data-plane envelopes defined by each individual skill (`env.*` inside

`skills/<id>/mova/env/`).

