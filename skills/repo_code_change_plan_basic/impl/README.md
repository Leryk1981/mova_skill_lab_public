# Implementation for `skill.repo_code_change_plan_basic`

This folder contains the green-layer implementation:

- `prompts/` – prompt profile for LLM-based planning:
  - `repo_code_change_plan_profile.md` – instructions for the LLM on how to generate structured change plans

- `bindings/` – runtime binding definitions:
  - `repo_code_change_plan_llm_binding_v1.json` – LLM profile binding (no external calls)

The MOVA contracts for this skill are defined under `mova/`.

Implementation is free to change as long as it respects those contracts.

## Runtime bindings

The `bindings/` folder contains runtime binding definitions for this skill:

- Each `*.json` file is expected to follow `core/mova/ds/ds.skill_runtime_binding_v1.schema.json`.

- A binding describes **how** and **where** the skill is executed.

This skill uses an `llm_profile` runtime type, meaning it is executed by an LLM following the prompt profile. No external HTTP requests, MCP calls, or local scripts are involved. The skill never modifies files or executes code – it only generates planning documents.

