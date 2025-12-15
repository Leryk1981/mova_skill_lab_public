# MOVA Skills Lab — Project Snapshot (2025-12-04)

## 1. Repository overview

MOVA Skills Lab is a monorepository for exploring and organizing "skills" for LLMs using the MOVA 4.0.0 framework. The repository is structured according to the three-layer principle: red (MOVA core), yellow (skills), green (experiments and execution).

The lab follows a **contract-first** approach: skills are defined by their MOVA schemas and envelopes, independent of any specific runtime or agent framework. This enables skills to be reusable, testable, and composable across different execution environments.

## 2. Directory structure

```
mova_skills_lab/
├── docs/                           # Human-readable documentation
│   ├── 00_INDEX.md                 # Documentation index
│   ├── 01_MOVA_CONSTITUTION.md     # MOVA principles
│   ├── 02_LAYERS_RED_YELLOW_GREEN.md
│   ├── 03_GLOBAL_VOCABULARY.md
│   ├── 04_ENVELOPE_SPEC.md
│   ├── 05_SCHEMA_SPEC.md
│   ├── 06_EPISODES_GENETIC_LAYER.md
│   ├── 07_RUNTIME_AND_ADAPTERS.md
│   ├── 08_CONTEXT7_MCP_PROFILE.md
│   ├── 09_IDE_AGENT_PROFILE.md
│   ├── 10_SKILLS_OVERVIEW.md       # Overview of all skills
│   ├── 20_SKILLS_LAB_MANIFEST.md   # Core principles and policies
│   ├── 21_CALL_ENVELOPE_PRIMITIVE.md
│   ├── 30_FILE_CLEANUP_RECIPE.md
│   └── PROJECT_SNAPSHOT_*.md       # Repository snapshots
├── core/                           # Red layer — MOVA core
│   └── mova/
│       ├── 00_MANIFEST.json        # Core manifest
│       ├── global/                 # Global vocabulary
│       │   ├── roles.json
│       │   ├── resources.json
│       │   ├── states.json
│       │   └── verbs.json
│       ├── ds/                      # Data schemas (ds.*)
│       │   ├── ds.episode_v1.schema.json
│       │   ├── ds.episode_policy_v1.schema.json
│       │   ├── ds.skill_descriptor_v1.schema.json
│       │   ├── ds.skill_registry_v1.schema.json
│       │   ├── ds.skill_run_request_v1.schema.json
│       │   ├── ds.skill_runtime_binding_v1.schema.json
│       │   ├── ds.call_request_v1.schema.json
│       │   └── ds.call_result_v1.schema.json
│       ├── env/                     # Envelopes (env.*)
│       │   ├── env.skill_run_v1.schema.json
│       │   └── env.call_run_v1.schema.json
│       ├── episodes/                # Episodes and genetic layer
│       └── specs/                   # Official MOVA 4.0.0 examples/schemas (see canonical spec)
├── skills/                          # Yellow layer — skills
│   ├── mova_template/               # Template skill structure
│   ├── context7_docs/               # Context7 MCP connector
│   ├── mova_lab_operator/          # Meta-skill for IDE agents
│   ├── repo_snapshot_basic/         # Repository snapshot generator
│   ├── skill_scaffolder_basic/      # Skill scaffold generator
│   ├── connector_scaffolder_basic/  # Connector scaffold generator
│   ├── runtime_binding_code_scaffolder_basic/  # Runtime binding generator
│   ├── code_exec_task_basic/        # CLI command execution
│   ├── repo_code_change_plan_basic/ # Code change planning
│   └── file_cleanup_basic/          # File cleanup (experimental/archived)
├── lab/                             # Green layer — experiments
│   ├── skills_registry_v1.json      # Central skills registry
│   └── skill_runs/                  # Example run requests
├── tools/                           # Validation and planning tools
│   ├── validate_lab.js             # Lab-wide validation
│   ├── record_episode.js            # Episode recorder
│   └── run_skill_plan.js            # Skill run planner
├── package.json
└── .gitignore
```

## 3. Key components and files

### Red Core (`core/mova/`)

The red core contains shared MOVA 4.0.0 contracts used by all skills in the lab. It contains no executable code, only data descriptions, actions, and envelopes.

**Key schemas:**
- `ds.episode_v1.schema.json` — standardized format for execution episodes
- `ds.skill_descriptor_v1.schema.json` — skill manifest schema
- `ds.skill_registry_v1.schema.json` — skills registry schema
- `ds.skill_run_request_v1.schema.json` — control-plane request to run a skill
- `ds.call_request_v1.schema.json` / `ds.call_result_v1.schema.json` — call-envelope primitives

**Key envelopes:**
- `env.skill_run_v1.schema.json` — control-plane envelope for skill execution
- `env.call_run_v1.schema.json` — second-order envelope for invoking other envelopes

**Global vocabulary:**
- `roles.json` — roles: `human`, `agent`, `tool`, `worker`, `registry`
- `resources.json` — resources: `skill`, `procedure`, `episode`, `envelope`, `catalog`, `file`, `note`
- `states.json` — lifecycle states: `draft`, `planned`, `running`, `succeeded`, `failed`, `cancelled`, `archived`
- `verbs.json` — verbs: `create`, `update`, `publish`, `record`, `route`, `transform`, `scan`, `run`, `call`

### Yellow Layer (`skills/`)

Each skill follows a standard structure:
- `manifest.skill.json` — skill descriptor (instance of `ds.skill_descriptor_v1`)
- `mova/ds/` — local input/output schemas
- `mova/env/` — local envelope definitions
- `impl/prompts/` — LLM prompt profiles (for LLM-only skills)
- `impl/bindings/` — runtime bindings (MCP, local script, etc.)
- `cases/` — example cases with expected outputs
- `episodes/` — recorded execution episodes
- `SKILL.md` — skill documentation

**Infrastructure skills:**
- `skill.repo_snapshot_basic` — creates standardized repository snapshots
- `skill.skill_scaffolder_basic` — generates complete skill scaffolds from descriptions
- `skill.connector_scaffolder_basic` — generates connector skill scaffolds
- `skill.runtime_binding_code_scaffolder_basic` — generates code-level runtime bindings
- `skill.code_exec_task_basic` — standardized CLI command execution
- `skill.repo_code_change_plan_basic` — generates structured code change plans

**Connector skills:**
- `skill.context7_docs` — fetches library documentation via Context7 MCP

**Meta-skills:**
- `skill.mova_lab_operator` — helps IDE agents navigate and operate the lab

### Green Layer (`lab/`)

- `skills_registry_v1.json` — central registry of all skills and their runtime bindings
- `skill_runs/` — example `ds.skill_run_request_v1` files for testing

### Tools (`tools/`)

- `validate_lab.js` — validates all schemas, manifests, and registry entries
- `record_episode.js` — creates `ds.episode_v1` JSON files from skill cases
- `run_skill_plan.js` — plans skill runs without execution (reads `ds.skill_run_request_v1`)

## 4. Build, run and test

**Validation:**
```bash
npm run validate
```

This runs `tools/validate_lab.js`, which:
- Validates all JSON schemas (ds.*, env.*) using Ajv with draft-2020-12 support
- Validates all skill manifests against `ds.skill_descriptor_v1`
- Validates the skills registry against `ds.skill_registry_v1`
- Validates all runtime bindings against `ds.skill_runtime_binding_v1`
- Validates all skill cases (envelopes and expected outputs)

**Dependencies:**
- Node.js (for validation tools)
- `ajv` ^8.17.0 (JSON schema validation)
- `ajv-formats` ^3.0.1 (format validation)

**No build step required** — this is a schema/documentation repository, not a compiled project.

## 5. Configuration and external dependencies

**External services:**
- **Context7 MCP server** — used by `skill.context7_docs` to fetch library documentation
  - Requires `CONTEXT7_API_KEY` environment variable
  - Configured via MCP binding in `skills/context7_docs/impl/bindings/context7_mcp_remote_v1.json`

**Configuration files:**
- `package.json` — Node.js project metadata and validation script
- `.gitignore` — Git ignore rules (excludes `node_modules/`, `temp_*`, etc.)
- `lab/skills_registry_v1.json` — central registry of skills and bindings

**No runtime dependencies** — all skills are contract definitions. Execution happens via external runtimes (MCP, local scripts, Cloudflare Workers, etc.) that respect the MOVA contracts.

## 6. Current status and open questions

**Current status:**
- ✅ Red core (MOVA 4.0.0 contracts) — complete
- ✅ Yellow layer (skills) — 10 skills defined:
  - 6 infrastructure skills (scaffolding, execution, planning)
  - 1 connector skill (Context7)
  - 1 meta-skill (lab operator)
  - 1 template skill
  - 1 experimental skill (file_cleanup_basic, archived)
- ✅ Green layer (lab tools) — validation, episode recording, run planning
- ✅ Documentation — comprehensive docs in `docs/`

**Open questions:**
1. **Orchestration layer**: How should scenarios (sequences of skill invocations) be formally defined? Currently described at documentation level only.
2. **Episode storage**: Should episodes be stored in a database or remain as JSON files?
3. **Runtime bindings**: How should bindings for Cloudflare Workers, HTTP APIs, etc. be implemented?
4. **Skill versioning**: How should skill versions be managed when contracts evolve?
5. **Testing framework**: Should there be a formal testing framework for validating skill contracts?
6. **Skill discovery**: How should external agents discover available skills and their contracts?
7. **Call-envelope orchestration**: How should the call-envelope primitive be used to build complex scenarios?

## 7. Suggested next steps

1. **Create a scenario definition format** — formalize how sequences of skill invocations are described
2. **Implement a skill runner** — create a runtime that can execute skills based on `ds.skill_run_request_v1` and respect `episode_policy`
3. **Add more connector skills** — use the `context7_docs` + `skill_scaffolder_basic` workflow to create connectors for other APIs
4. **Create a skill catalog** — publish skills to a MOVA 4.0.0 catalog using `env.mova4_core_catalog_publish_v1`
5. **Build orchestration examples** — demonstrate how call-envelopes can be used to chain skills together
6. **Add episode analysis tools** — create tools to analyze and learn from recorded episodes
7. **Document runtime binding patterns** — create examples for different runtime types (MCP, HTTP, Workers, etc.)
8. **Create skill templates** — expand `skill.mova_template` with more examples and patterns
9. **Add validation for prompt profiles** — ensure prompt profiles correctly reference schemas
10. **Build a skill playground** — create an interactive tool for testing skills and exploring contracts

