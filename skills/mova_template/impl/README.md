# Implementation for `skill.mova_template`

This folder will contain the green-layer implementation:

- `prompts/` – prompt design for LLM-based execution.

- `code/` – optional scripts or adapters (e.g. for local runners or agents).

The MOVA contracts for this skill are defined under `mova/`.

Implementation is free to change as long as it respects those contracts.

## Runtime bindings

The `bindings/` folder contains runtime binding definitions for this skill:

- Each `*.json` file is expected to follow `core/mova/ds/ds.skill_runtime_binding_v1.schema.json`.

- A binding describes **how** and **where** the skill is executed

  (e.g. local script, MCP server, Cloudflare Worker, Claude Skill, Gemini Agent, etc.).

In this bootstrap step we only provide a dummy local binding:

- `bindings/mova_template_local_dummy_binding.json`

