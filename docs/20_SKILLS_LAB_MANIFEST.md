# MOVA Skills Lab Manifest

This document defines the core principles, policies, and architecture of the MOVA Skills Lab.

---

## What is MOVA Skills Lab

MOVA Skills Lab is a skills laboratory built on the MOVA framework:

- **Red core**: `core/mova/` – shared data schemas (ds.*), envelopes (env.*), global vocabulary (roles, resources, states, verbs)
- **Yellow layer**: `skills/*` – individual skills, each with its own manifest, local schemas, and implementation
- **Green layer**: `lab/`, tools, recipes – registry, runtime bindings, orchestration patterns

Each skill in the lab is a **contract-first** component: it defines what it accepts and returns through MOVA schemas and envelopes, independent of any specific runtime or agent framework.

---

## How Skills Lab Differs from Agent Frameworks

### In Other Frameworks

- A skill = a prompt + framework-specific code
- Result format is semi-formal, tightly coupled to a specific runtime
- Skills are often embedded in the framework's execution model

### In MOVA Skills Lab

- A skill = a **contract** (ds + env + manifest + registry), independent of any specific agent
- Prompt profiles are thin adapters for specific LLMs/runtimes, not the "heart of the skill"
- The same skill can be executed by:
  - An LLM (via prompt profile)
  - HTTP code (via API binding)
  - An MCP tool (via MCP binding)
  - A Cloudflare Worker (via worker binding)
  - Any other runtime that respects the MOVA contract

The contract is the source of truth; implementations are interchangeable as long as they fulfill the contract.

---

## Roles of Skills and Scenarios

### Skills

A **skill** is an atomic action with a clear input/output contract:

- Defined by `ds.*` schemas (input and output)
- Wrapped in an `env.*` envelope (verb + resource)
- Described in `manifest.skill.json` (metadata, dependencies, episode policy)
- Registered in `lab/skills_registry_v1.json` (with runtime bindings)

Skills are **stateless** and **composable**: they can be chained together to form workflows.

### Scenarios (Recipes)

A **scenario** (or recipe) is a sequence of skill invocations. Currently, scenarios are described at the documentation/operator level, without a separate formal format.

**Orchestration is not built into skills** – it lives above them. Skills don't know about each other; orchestration happens at the operator/IDE level.

---

## Policy on Connectors

Any skill that wraps an external API or tool:

- Relies on documentation of that API
- In Skills Lab, we follow this rule:

  > **Connectors are created through the pair `skill.context7_docs` + `skill.skill_scaffolder_basic`, not directly.**

### Workflow for Creating Connectors

1. **Gather API documentation**: Use `skill.context7_docs` to fetch and summarize the API documentation
2. **Generate scaffold**: Use `skill.skill_scaffolder_basic` with `skill_kind = "connector"` and the API summary in `input_brief`/`output_brief`/`notes_for_prompt_profile`
3. **Apply the plan**: Create files from the generated `files[]` array
4. **Implement runtime binding**: Add the actual HTTP/MCP/other binding based on the scaffold

**Direct approach is discouraged**: "LLM, read the entire website and invent a connector yourself" is not the recommended pattern. The two-skill workflow ensures:

- API documentation is captured explicitly
- The scaffold follows MOVA patterns consistently
- The connector contract is clear and testable

Orchestration of `context7_docs` + scaffolder is done at the operator/IDE level, not inside skills.

---

## Policy on Prompt Profiles

All **semantic structure** lives in ds/env schemas. Prompt profiles are:

- **Short** (1-2 screens)
- **Format-focused**: They describe only the input/output format and basic rules
- **Runtime-agnostic**: They don't duplicate large documentation about MOVA or Skills Lab

Prompt profiles are thin adapters that tell an LLM:
- What JSON structure to expect (input)
- What JSON structure to produce (output)
- Basic constraints (no web search, no external APIs, etc.)

They do **not** contain:
- Full MOVA documentation
- Detailed explanations of Skills Lab architecture
- Long examples or tutorials

The schemas (ds/env) are the source of truth; prompt profiles are just execution hints.

---

## Call-Envelope Primitive

MOVA Skills Lab includes a **call-envelope** primitive (`env.call_run_v1`) as a foundational building block for scenarios.

### What is Call-Envelope

A call-envelope is a **second-order speech act**: it describes "invoke another envelope with this data" rather than performing a direct action.

- **Regular envelope**: `env.repo_snapshot_run_v1` directly transforms repository data into a snapshot
- **Call-envelope**: `env.call_run_v1` invokes `env.repo_snapshot_run_v1` (or any other envelope) with provided data

### Structure

- **`ds.call_request_v1`**: Describes which envelope to call (`target_envelope_id`) and what data to pass (`data`)
- **`ds.call_result_v1`**: Describes the result (success with output, or error with details)
- **`env.call_run_v1`**: The envelope wrapper (verb: `"call"`, resource: `"envelope"`)

### Use Cases

Call-envelopes enable:
- **Meta-skills** that propose plans involving multiple envelope invocations
- **Scenarios/recipes** that chain skill calls together
- **Orchestration layers** that coordinate multiple skills

### Important Notes

- Call-envelope is a **red-zone primitive**: it belongs to `core/mova/`, not to any specific skill
- It does **not** include orchestration logic (sequencing, conditionals, loops) – that lives in a separate orchestration layer
- It provides the **foundation** for building scenarios, but scenarios themselves are defined at a higher level

See `docs/21_CALL_ENVELOPE_PRIMITIVE.md` for detailed documentation.

---

## Summary

MOVA Skills Lab is:

- **Contract-first**: Skills are defined by their MOVA contracts, not by implementation
- **Runtime-agnostic**: The same skill can run on different runtimes
- **Composable**: Skills are atomic and can be chained into scenarios
- **Explicit**: Connectors are created through documented workflows, not ad-hoc
- **Minimal**: Prompt profiles are thin, schemas are the source of truth

This architecture enables skills to be:
- Reusable across different agents and frameworks
- Testable through their contracts
- Documented through their schemas
- Evolvable without breaking contracts

