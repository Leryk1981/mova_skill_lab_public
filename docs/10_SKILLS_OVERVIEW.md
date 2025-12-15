# Skills overview

This document lists all skills defined in `skills/` and their status.

For now, there are no concrete skills yet. The first planned skill is:

- `skill.file_cleanup` – skill for intelligent disk inventory and cleanup,

  based on MOVA data types and envelopes for files and episodes.

Each skill will get:

- a manifest (`manifest.skill.json`),

- local `mova/ds` and `mova/env` overlays,

- example cases,

- and its own `episodes/` and `impl/` folders.

## Skill descriptor schema

Each skill has a manifest file, for example:

- `skills/mova_template/manifest.skill.json`

These manifests are expected to follow the shared schema:

- `core/mova/ds/ds.skill_descriptor_v1.schema.json`

This schema defines fields such as:

- `skill_id`, `title`, `description`, `mova_core_version`

- `uses_ds`, `uses_env`, `tags`

- `state`, `resources`, `verbs`

- `created_at`, `updated_at`

- `episode_policy` (optional) – describes when episodes should be recorded

Each skill manifest (`manifest.skill.json`) is an instance of

`ds.skill_descriptor_v1` and may optionally include an `episode_policy`

field, which describes when episodes should be recorded for that skill.

## Skills registry

The lab maintains a skills registry instance:

- `lab/skills_registry_v1.json`

This document follows the schema:

- `core/mova/ds/ds.skill_registry_v1.schema.json`

It lists:

- which skills exist in the lab,

- where their manifests live,

- which runtime bindings are available for each skill.

Future meta-skills and tools can rely on this registry instead of scanning

the filesystem manually.

## Current skills

- `skill.mova_template` – canonical example skill that transforms natural-language

  procedure descriptions into structured step lists. Serves as the reference

  pattern for other MOVA skills.

- `skill.context7_docs` – uses the Context7 MCP server to fetch

  up-to-date library documentation before working on a project.

- `skill.mova_lab_operator` – meta-скіл, який описує, як IDE-агенти працюють з лабораторією.

- `skill.repo_snapshot_basic` – LLM-only skill that creates standardized repository snapshots. Accepts a repository structure dump, README content, and user notes, then returns:
  - `project_snapshot_md` – comprehensive markdown snapshot with fixed section structure
  - `global_memory_md` – condensed summary (3-10 bullet points) for inserting into a new chat's global memory
  - `checklist_for_human` – markdown list of actions (where to save the snapshot, how to update memory)
  
  **Manifest**: `skills/repo_snapshot_basic/manifest.skill.json`
  
  **Runtime**: `llm_profile` – executed by an LLM following the prompt profile at `impl/prompts/repo_snapshot_profile.md`. No external HTTP requests, MCP calls, or local scripts.
  
  **When to use**: Before switching chat contexts, when onboarding to a new repository, or when creating a status update snapshot for documentation.

- `skill.skill_scaffolder_basic` – meta-skill that generates complete file plans for new MOVA skills based on high-level textual descriptions. Takes a request describing what a new skill should do and returns a structured plan with all necessary files (schemas, envelope, manifest, prompt profile, runtime binding, docs, cases).
  
  **Manifest**: `skills/skill_scaffolder_basic/manifest.skill.json`
  
  **Runtime**: `llm_profile` – executed by an LLM following the prompt profile at `impl/prompts/skill_scaffolder_profile.md`. No external HTTP requests, MCP calls, or local scripts.
  
  **When to use**: 
  - When creating a new LLM-only transform skill (`skill_kind = "llm_transform"`) and you want a complete scaffold generated automatically.
  - When creating a new connector skill (`skill_kind = "connector"`) that wraps an external API/tool.
  
  **Skill kinds supported**:
  - `llm_transform`: Pure LLM-only transform skills (no external APIs). Uses `skill.repo_snapshot_basic` and `skill.mova_template` as reference patterns.
  - `connector`: Skills that wrap external APIs/tools. For connectors, the recommended workflow is:
    1. Use `skill.context7_docs` to gather and summarize API documentation
    2. Use `skill.skill_scaffolder_basic` with `skill_kind = "connector"` and the API summary in the request
    3. Apply the generated file plan
    4. Implement the actual runtime binding
  
  **Generated files**: The scaffolder generates data schemas (request/result), envelope, manifest, prompt profile, runtime binding, documentation (SKILL.md, README files), case example (optional), and registry/docs snippets for integration.
  
  **Limitations**: Returns a plan only; the human or tool must create the files. The scaffolder never fetches external docs or calls other skills – it only uses information provided in the request.

- `skill.connector_scaffolder_basic` – meta-skill specialized for generating MOVA connector skill scaffolds. Takes a connector description (vendor, service, operations) and an API documentation bundle (typically from `skill.context7_docs`), then returns a complete file plan for a new connector skill.
  
  **Manifest**: `skills/connector_scaffolder_basic/manifest.skill.json`
  
  **Runtime**: `llm_profile` – executed by an LLM following the prompt profile at `impl/prompts/connector_scaffolder_profile.md`. No external HTTP requests, MCP calls, or local scripts.
  
  **When to use**: When creating a new connector skill that wraps an external API or tool. The recommended workflow is:
  1. Use `skill.context7_docs` to gather API documentation
  2. Describe the connector (vendor, service, operations) and prepare a `ds.connector_scaffold_request_v1` with the docs bundle
  3. Run `skill.connector_scaffolder_basic` to generate the scaffold
  4. Apply the generated file plan
  5. Implement the actual runtime binding code
  
  **Input**: Connector description (vendor, service, operations) and API docs bundle (from `skill.context7_docs` or similar).
  
  **Output**: Complete file plan with data schemas, envelope(s), manifest, prompt profile, runtime binding stub, documentation, and cases.
  
  **Limitations**: Returns a plan only; the human or tool must create the files. The scaffolder never fetches external docs or calls other skills. Runtime bindings are stubs describing API structure, not actual implementations.

- `skill.runtime_binding_code_scaffolder_basic` – meta-skill that generates code skeletons and binding files for connecting MOVA skill envelopes to real execution runtimes. Takes a skill description, list of envelopes, and target runtime requirements, then returns code skeleton files that implement the envelope contracts.

  **Manifest**: `skills/runtime_binding_code_scaffolder_basic/manifest.skill.json`

  **Runtime**: `llm_profile` – executed by an LLM following the prompt profile at `impl/prompts/runtime_binding_scaffolder_profile.md`. No external HTTP requests, MCP calls, or local scripts. The scaffolder never executes code or accesses the filesystem.

  **When to use**: After creating a MOVA connector skill (e.g., via `skill.connector_scaffolder_basic`) and you need to implement the actual runtime binding code. The recommended workflow is:
  1. Use `skill.connector_scaffolder_basic` to create the MOVA connector structure (schemas, envelope, manifest, prompt profile, binding stub)
  2. Use `skill.runtime_binding_code_scaffolder_basic` with the skill identifier, list of envelopes, target runtime (node_script, cloudflare_worker, cli_command), and the binding stub from step 1
  3. Apply the generated code files
  4. Complete the implementation (fill in TODOs, add tests, implement error handling)
  5. Test and deploy

  **Input**: Skill identifier, directory, runtime kind (node_script/cloudflare_worker/cli_command/other), target language (ts/js), code entry path, list of envelopes to implement, optional binding stub, optional code style preferences.

  **Output**: Code skeleton files (main entry file with functions for each envelope), optional binding JSON updates, design notes, and checklist for the developer.

  **Supported runtimes**:
  - `node_script`: Node.js/TypeScript module with exported async functions
  - `cloudflare_worker`: Cloudflare Worker handler wrapper
  - `cli_command`: CLI wrapper with argument parsing
  - `other`: General case with runtime-specific patterns

  **Limitations**: Generates code skeletons only, not complete implementations. TODOs indicate where work is needed. Never hardcodes secrets (uses environment variables). Never executes code or accesses the filesystem.

  **Relationship to other skills**: Together with `skill.connector_scaffolder_basic`, forms a complete pipeline: MOVA-level connector → code-level binding.

- `skill.code_exec_task_basic` – basic infrastructural skill for executing CLI commands in a repository with a unified result format. Standardizes how commands are run (working directory, command arguments, timeout, env overrides) and captures results (exit code, stdout/stderr, duration) with a human-readable summary.

  **Manifest**: `skills/code_exec_task_basic/manifest.skill.json`

  **Runtime**: `local_script` – executes actual CLI commands via a Node.js script or equivalent runtime handler. The binding spawns processes, captures output, handles timeouts, and then uses an LLM to format the summary.

  **When to use**: When you need to execute any CLI command (tests, builds, validation, deployment) and want standardized results with formatted summaries. Typical scenarios:
  - Running tests: `["npm", "test"]`
  - Validating schemas: `["npm", "run", "validate"]`
  - Building projects: `["npm", "run", "build"]`
  - Deploying: `["npx", "wrangler", "deploy"]`

  **Input**: Command request with working directory, command arguments, timeout, capture limits, env overrides, and optional notes.

  **Output**: Execution result with status, exit code, stdout/stderr, duration, formatted markdown summary, and optional next-step notes.

  **What it does NOT do**: Does not edit code, does not build change plans, does not orchestrate deployments. It only executes commands and reports results.

  **Episode policy**: Records episodes on errors/timeouts (`mode: "on_error"`) for debugging and learning.

  **Relationship to other skills**: Completes the scaffolding pipeline:
  - `skill.connector_scaffolder_basic` → creates MOVA connector structure
  - `skill.runtime_binding_code_scaffolder_basic` → generates code skeleton
  - `skill.code_exec_task_basic` → **executes the generated code** (tests, builds, deploys)

  Together, they form a complete chain:
  **"API description → MOVA connector → code binding → standardized code execution"**

- `skill.repo_code_change_plan_basic` – meta-skill that generates structured, step-by-step plans for code changes in a repository. Takes a repository snapshot (typically from `skill.repo_snapshot_basic`), goal description, and constraints, then produces a detailed plan of what files to change, in what order, with risks and completion criteria.

  **Manifest**: `skills/repo_code_change_plan_basic/manifest.skill.json`

  **Runtime**: `llm_profile` – executed by an LLM following the prompt profile at `impl/prompts/repo_code_change_plan_profile.md`. No external HTTP requests, MCP calls, or local scripts. The skill never modifies files or executes code.

  **When to use**: When you need to plan code changes before making them. Typical scenarios:
  - Adding a new connector skill
  - Updating an existing skill
  - Making infrastructure changes
  - Improving documentation or test coverage

  **Input**: Repository snapshot (markdown), goal summary (3–10 lines), optional constraints (must_not_touch paths, preferred areas, additional constraints).

  **Output**: Structured change plan with:
  - High-level overview (1–3 paragraphs)
  - Ordered steps (each with title, summary, change kind, target files, dependencies, risks, completion criteria)
  - Global risks assessment
  - Checklist for the developer

  **What it does NOT do**: Does not modify files, does not execute commands, does not guarantee completeness. It's a planning tool, not a perfect oracle.

  **Episode policy**: Does not record episodes (`mode: "none"`) because planning steps are typically not stored.

  **Relationship to other skills**: Completes the infrastructure pipeline:
  1. `skill.repo_snapshot_basic` → creates repository snapshot
  2. `skill.repo_code_change_plan_basic` → **generates change plan** (this skill)
  3. `skill.connector_scaffolder_basic` → creates MOVA connector structure
  4. `skill.runtime_binding_code_scaffolder_basic` → generates code skeleton
  5. `skill.code_exec_task_basic` → executes code (tests, builds, deploys)

  Together, they form a complete cycle:
  **"Repository context → change plan → MOVA connector → code binding → standardized code execution"**

## Lab / Experimental skills

- `skill.file_cleanup_basic` – **Lab experiment / scaffolder test**. LLM-only skill that analyzes a snapshot of a single disk or partition and generates a safe, structured cleanup plan. This skill was created mainly to test the scaffolder pipeline and is **not recommended for production use**. Existing tools (like WinDirStat, TreeSize, etc.) are usually a better fit for real disk cleanup.
  
  **Status**: `archived` (lab experiment)
  
  **Manifest**: `skills/file_cleanup_basic/manifest.skill.json`
  
  **Runtime**: `llm_profile` – executed by an LLM following the prompt profile at `impl/prompts/file_cleanup_profile.md`. No external HTTP requests, MCP calls, or local scripts. The skill never accesses the real filesystem.
  
  **Note**: This skill serves as a test case for the scaffolder workflow and demonstrates MOVA skill structure, but is not intended for regular use.

