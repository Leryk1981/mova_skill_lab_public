# skill.skill_scaffolder_basic

## Purpose

A meta-skill that generates complete file plans for new MOVA skills based on high-level textual descriptions. It takes a request describing what a new skill should do and returns a structured plan with all necessary files (schemas, envelope, manifest, prompt profile, runtime binding, docs, cases).

## When to Use

- When creating a new LLM-only transform skill (`skill_kind = "llm_transform"`) and you want a complete scaffold generated automatically.
- When creating a new connector skill (`skill_kind = "connector"`) that wraps an external API/tool.
- When you need a consistent structure for new skills following MOVA patterns.
- When onboarding new contributors who need to understand the skill structure.

## How It Works

The skill is executed by an LLM following the prompt profile at `impl/prompts/skill_scaffolder_profile.md`. The LLM:

1. Receives a `ds.skill_scaffold_request_v1` with a high-level skill description
2. Analyzes the request and designs the skill structure
3. Generates all required files with complete content
4. Returns a `ds.skill_scaffold_result_v1` with the file plan

## Generated Files

The scaffolder generates:

- **Data schemas**: `ds.<local>_request_v1.schema.json` and `ds.<local>_result_v1.schema.json`
- **Envelope**: `env.<local>_run_v1.schema.json`
- **Manifest**: `manifest.skill.json` (instance of `ds.skill_descriptor_v1`)
- **Prompt profile**: `impl/prompts/<local>_profile.md`
- **Runtime binding**: `impl/bindings/<local>_llm_binding_v1.json`
- **Documentation**: `SKILL.md` and README files for structure
- **Case example**: `cases/<local>_case_01.json` (optional)
- **Registry/docs snippets**: JSON and markdown fragments for integration

## Constraints

- **Two skill kinds supported**: 
  - `llm_transform`: Pure LLM-only transform skills (no external APIs)
  - `connector`: Skills that wrap external APIs/tools
- **No file system changes**: Returns a plan only; the human or tool must create the files.
- **No external calls**: The scaffolder never fetches external docs or calls other skills. It only uses information provided in the request.
- **MOVA compliance**: All generated schemas and envelopes follow MOVA 4.0.0 patterns.
- **Reference patterns**: 
  - For `llm_transform`: Uses `skill.repo_snapshot_basic` and `skill.mova_template` as templates.
  - For `connector`: Uses `skill.context7_docs` as a reference for MCP-based connectors.

## How to Use for Connectors

When creating a connector skill:

1. **Gather API documentation**: Use `skill.context7_docs` to fetch and summarize the API documentation. This provides the API description, endpoints, schemas, and constraints.

2. **Prepare the scaffold request**: Create a `ds.skill_scaffold_request_v1` with:
   - `skill_kind = "connector"`
   - API description in `input_brief`/`output_brief`/`notes_for_prompt_profile` (from step 1)

3. **Run the scaffolder**: Execute `env.skill_scaffold_run_v1` with the prepared request.

4. **Apply the plan**: Create all files from the generated `files[]` array in the result.

5. **Implement runtime binding**: Add the actual HTTP/MCP/other binding based on the scaffolded structure.

This workflow ensures that connectors are created through explicit documentation gathering (`skill.context7_docs`) followed by scaffold generation (`skill.skill_scaffolder_basic`), rather than ad-hoc LLM-based connector creation.

## MOVA Contracts

- **Input**: `ds.skill_scaffold_request_v1` (via `env.skill_scaffold_run_v1`)
- **Output**: `ds.skill_scaffold_result_v1` (via `env.skill_scaffold_run_v1`)
- **Verb**: `transform`
- **Resource**: `note`

