# MOVA layer for skill.context7_docs

This folder will contain local MOVA definitions for the Context7 docs skill:

- `ds/` – data schemas for Context7 queries and responses (to be added later)

- `env/` – envelopes describing how to request docs from Context7

For now, the skill only reuses the shared `ds.episode_v1` schema.

## Local schemas

This skill defines the following local MOVA schemas:

- `ds.context7_docs_request_v1` – describes what we ask Context7 for.

- `ds.context7_docs_bundle_v1` – describes the structured docs bundle we expect.

- `env.context7_docs_fetch_v1` – envelope tying the skill, verb, resource,

  request and expected bundle together.

