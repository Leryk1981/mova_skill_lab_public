# MOVA Skills Lab – IDE Agent Protocol v1

## 1. Purpose

This protocol defines the standard workflow for an IDE agent working inside a project repository that uses MOVA Skills Lab as a skills backend. Instead of relying on long free-form prompts, the agent follows contract-first workflows: it discovers available skills through the lab's registry, prepares structured requests (ds.* schemas), and executes skills through their defined envelopes (env.*).

The protocol ensures consistent, reproducible, and safe interactions between IDE agents and MOVA Skills Lab across different projects and agent implementations.

## 2. Assumptions and Repository Layout

### Repository Structure

- The project may embed `mova_skills_lab/` as a subfolder, or access it via MCP (Model Context Protocol).
- The lab contains:
  - `docs/01_MOVA_CONSTITUTION.md` — core MOVA principles
  - `docs/20_SKILLS_LAB_MANIFEST.md` — lab architecture and policies
  - `lab/skills_registry_v1.json` — central registry of all registered skills and connectors
  - `core/mova/` — shared MOVA schemas (ds.*) and envelopes (env.*)
  - `skills/*/` — individual skill definitions with manifests, schemas, and bindings

### Agent Capabilities

- The agent can read files, run local commands, and modify files in the repository.
- Git operations (creating branches, commits, pushes) require explicit user consent.
- The agent has access to the IDE's file system and terminal, but should avoid destructive operations.

## 3. Agent Role and Capabilities

The agent acts as a **project co-developer** that delegates as much as possible to MOVA skills (ds/env contracts) instead of inventing ad-hoc workflows. This approach ensures:

- **Consistency**: Skills follow standardized contracts, making them reusable and testable.
- **Traceability**: All skill invocations are structured and can be recorded as episodes.
- **Safety**: Skills are scoped and validated, reducing the risk of unintended side effects.

### Core Capabilities

- **Discover MOVA Skills Lab** in the repository (subfolder or MCP).
- **Inspect** `skills_registry_v1.json` and individual skill manifests to understand available capabilities.
- **Prepare** ds.* request payloads according to skill schemas.
- **Call skills** through their defined envelopes (env.*).
- **Propose code changes** based on skill outputs and execute small, well-scoped steps.

## 4. Standard Workflow: From Repository to Code Changes

### Step 0 – Locate MOVA Skills Lab

1. Search for `mova_skills_lab/` in the workspace (or check MCP configuration).
2. Read foundational documents:
   - `docs/01_MOVA_CONSTITUTION.md` — understand MOVA principles
   - `docs/20_SKILLS_LAB_MANIFEST.md` — understand lab architecture
   - `lab/skills_registry_v1.json` — discover available skills
3. Confirm which core infrastructure skills are available:
   - `skill.repo_snapshot_basic` — repository snapshot generation
   - `skill.repo_code_change_plan_basic` — structured change planning
   - `skill.code_exec_task_basic` — CLI command execution
   - `skill.skill_scaffolder_basic` — skill scaffold generation
   - `skill.connector_scaffolder_basic` — connector scaffold generation
   - `skill.runtime_binding_code_scaffolder_basic` — runtime binding code generation

### Step 1 – Repository Snapshot (`skill.repo_snapshot_basic`)

**When to use**: When the user asks for an overview of the repository, or when starting work on a new project.

**Process**:

1. Prepare `ds.repo_snapshot_request_v1`:
   - `repo_name`: project name
   - `raw_repo_tree`: compressed directory tree (exclude `node_modules/`, `.git/`, build outputs)
   - `raw_readme`: content of main README file (if available)
   - `raw_notes_from_user`: any additional context from the user
   - `snapshot_purpose`: e.g., "initial_context_for_llm", "status_update"
   - `preferred_language`: user's preferred language (if known)

2. Call `skill.repo_snapshot_basic` through its envelope `env.repo_snapshot_run_v1`.

3. Receive structured output:
   - `project_snapshot_md`: comprehensive markdown snapshot
   - `global_memory_md`: condensed summary for global memory
   - `checklist_for_human`: suggested next actions

4. Optionally persist the result:
   - Save `project_snapshot_md` as `docs/PROJECT_SNAPSHOT_<DATE>_<repo>.md`
   - Link it from the project's README or documentation index

### Step 2 – Change Plan (`skill.repo_code_change_plan_basic`)

**When to use**: When the user wants a refactor, migration, or significant code change.

**Process**:

1. Prepare `ds.repo_code_change_plan_request_v1`:
   - `goal_summary`: high-level description of what needs to be achieved
   - `repo_snapshot`: reference to a recent snapshot (or provide key context)
   - `constraints`: what must not be touched yet (e.g., "do not modify API contracts", "preserve backward compatibility")
   - `preferred_language`: user's preferred language

2. Call `skill.repo_code_change_plan_basic` through `env.repo_change_plan_run_v1`.

3. Receive structured plan:
   - `files_to_touch`: list of files/areas that will be modified
   - `steps`: ordered sequence of change steps
   - `risks`: potential issues and mitigation strategies
   - `completion_criteria`: how to verify the changes are complete

4. Present the plan to the user:
   - Separate **mandatory steps** (required for the goal) from **optional steps** (nice-to-have)
   - Highlight risks and dependencies
   - **Do not change files or run git commands at this stage**

### Step 3 – Execute a Small Step (`skill.code_exec_task_basic`)

**When to use**: After the user approves a step from the change plan, or when executing a well-scoped task.

**Process**:

1. For a chosen step, prepare one or more `ds.code_exec_request_v1` commands:
   - `command`: the CLI command to execute (e.g., `npm run build`, `git checkout -b feature/xyz`)
   - `working_directory`: where to run the command (relative to repo root)
   - `description`: human-readable description of what this command does
   - `expected_exit_code`: optional, for validation

2. Use `skill.code_exec_task_basic` through `env.code_exec_run_v1` to execute the command.

3. Receive execution result:
   - `exit_code`: command exit code
   - `stdout`: standard output
   - `stderr`: standard error
   - `summary`: LLM-generated summary of the execution

4. Report to the user:
   - Which files were changed/created
   - Which commands were run and their results
   - Build/test status (if applicable)

5. **Git operations**: If the step involves git (branch creation, commits), propose the operation explicitly and wait for user approval before executing.

### Step 4 – Scaffold a New Skill (`skill.skill_scaffolder_basic`)

**When to use**: When the user wants a reusable, contract-first capability that should be available as a MOVA skill.

**Process**:

1. Prepare `ds.skill_scaffold_request_v1`:
   - `new_skill_id`: e.g., `skill.my_project_analyzer_basic`
   - `new_skill_dir`: directory name (e.g., `my_project_analyzer_basic`)
   - `title`: human-readable title
   - `description`: what the skill does
   - `skill_kind`: `"llm_transform"` or `"connector"`
   - `input_brief`: high-level description of input
   - `output_brief`: high-level description of output
   - `notes_for_prompt_profile`: additional context for the LLM prompt profile
   - `include_examples`: whether to generate example cases
   - `include_docs`: whether to generate SKILL.md
   - `include_episodes`: whether to create episodes directory

2. Call `skill.skill_scaffolder_basic` through `env.skill_scaffold_run_v1`.

3. Receive scaffold plan:
   - `files[]`: array of files to create with their full content
   - Each file includes `path` and `content`

4. Create the skill structure:
   - Create directory `skills/<skill_dir>/`
   - Write all files from the `files[]` array
   - Ensure the skill is registered in `lab/skills_registry_v1.json` (add entry manually if needed)

5. Optionally run the new skill once against the current repository to verify it works.

### Step 5 – Scaffold a Connector (`skill.connector_scaffolder_basic`)

**When to use**: When the project needs to interact with external services (HTTP APIs, cloud services, databases).

**Process**:

1. Prepare `ds.connector_scaffold_request_v1`:
   - `connector_id`: e.g., `connector.my_api_client_basic`
   - `connector_dir`: directory name
   - `vendor`: service provider name (e.g., "GitHub", "Stripe")
   - `service_name`: specific service (e.g., "GitHub API", "Stripe Payments API")
   - `operations`: list of operations the connector will support
   - `endpoints`: API endpoints (if HTTP-based)
   - `example_payloads`: sample request/response payloads (if available)
   - `api_docs_summary`: summary of API documentation (can be generated via `skill.context7_docs`)

2. Call `skill.connector_scaffolder_basic` through `env.connector_scaffold_run_v1`.

3. Receive scaffold plan:
   - `files[]`: complete connector structure (manifest, schemas, bindings, cases)

4. Create the connector:
   - Create directory `connectors/<connector_dir>/` (or `skills/<connector_dir>/` if following skills structure)
   - Write all files from the scaffold
   - Register in `lab/skills_registry_v1.json` with connector ID

### Step 6 – Generate Runtime Bindings (`skill.runtime_binding_code_scaffolder_basic`)

**When to use**: When you need client code (TypeScript, Python, etc.) to call a MOVA skill or connector from application code.

**Two main cases**:

- **Client code for a skill**: Generate a typed function that calls a MOVA envelope (e.g., `runMySkill(input: MySkillInput): Promise<MySkillOutput>`).
- **Client code for a connector**: Generate a typed HTTP client or SDK wrapper based on the connector definition.

**Process**:

1. Prepare `ds.runtime_binding_code_request_v1`:
   - `target_language`: e.g., `"ts"`, `"py"`, `"js"`
   - `target_runtime`: e.g., `"browser"`, `"node"`, `"cloudflare_worker"`
   - `entry_file_path`: where to place the generated client (e.g., `src/mova/mySkillClient.ts`)
   - `envelope_ids`: list of envelope IDs to generate clients for
   - `input_output_hints`: optional type hints or examples for input/output

2. Call `skill.runtime_binding_code_scaffolder_basic` through `env.runtime_binding_scaffold_run_v1`.

3. Receive code scaffold:
   - `files[]`: generated client code files

4. Place generated clients in the project:
   - Write files to the specified paths (e.g., `src/mova/...Client.ts`)
   - Ensure imports and dependencies are correct

5. Optionally run the build to ensure the project still compiles:
   - Use `skill.code_exec_task_basic` to run `npm run build` or equivalent

## 5. Git and Safety Rules

### Git Operations

- **Git commands** (creating branches, commits, pushes) must be:
  - Proposed explicitly with clear descriptions
  - Executed only after user approval
  - Performed in a dedicated branch for multi-file changes

### Safety Principles

- **Prefer small, reversible steps**: Break large changes into atomic, testable steps.
- **Clear descriptions**: Always explain what files will be changed and why.
- **Branches for refactors**: Use feature branches for multi-file refactors to allow easy rollback.
- **Avoid blind bulk edits**: Never modify files without understanding their purpose.
- **Avoid destructive operations**: Never delete files or run destructive git commands without explicit user consent.

## 6. Language Conventions

### Human Communication

- The IDE agent should talk to the human in their preferred language (configured outside this protocol, e.g., in the IDE settings or user profile).

### Technical Identifiers

All technical identifiers **MUST remain in English**:

- Skill IDs: `skill.repo_snapshot_basic`
- Connector IDs: `connector.my_api_client_basic`
- File names: `manifest.skill.json`, `ds.my_schema_v1.schema.json`
- Schema names: `ds.repo_snapshot_request_v1`, `env.repo_snapshot_run_v1`
- Envelope IDs: `env.repo_snapshot_run_v1`
- Code identifiers: function names, class names, variable names in generated code

This ensures consistency across different languages and makes the contracts machine-readable and universally understandable.

## 7. Versioning and Evolution

This is **Protocol v1**. It should evolve based on:

- Real episodes recorded in `docs/EPISODE_*.md`
- Feedback from IDE agent implementations (Codex, Gemini, Qwen, etc.)
- Changes in MOVA Skills Lab architecture

When behavior changes in a breaking way, the protocol version should be bumped (e.g., to `v2`) and referenced from `09_IDE_AGENT_PROFILE.md`. The new version should maintain backward compatibility where possible or clearly document migration paths.

