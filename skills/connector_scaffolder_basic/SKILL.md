# skill.connector_scaffolder_basic

## Purpose

A meta-skill that generates complete file plans for new MOVA connector skills based on API descriptions and documentation bundles. It takes a request describing a connector (vendor, service, operations) and a docs bundle (typically from `skill.context7_docs`), then returns a structured plan with all necessary files for a new connector skill.

## When to Use

- When creating a new connector skill that wraps an external API or tool
- When you have API documentation (e.g., from `skill.context7_docs`) and want to scaffold a MOVA connector
- When you need a consistent structure for new connectors following MOVA patterns

## How It Works

The skill is executed by an LLM following the prompt profile at `impl/prompts/connector_scaffolder_profile.md`. The LLM:

1. Receives a `ds.connector_scaffold_request_v1` with:
   - Connector description (vendor, service, operations)
   - API documentation bundle (from `skill.context7_docs` or similar)
   - Optional runtime hints and notes

2. Analyzes the request and designs the connector structure:
   - Data schemas for requests/results
   - Envelope(s) for operations
   - Manifest, prompt profile, runtime binding stub
   - Documentation and cases

3. Generates all required files with complete content
4. Returns a `ds.connector_scaffold_result_v1` with the file plan

## Expected Flow

The recommended workflow for creating a connector:

1. **Gather API documentation**: Use `skill.context7_docs` to fetch and summarize the API documentation
2. **Describe the connector**: Prepare a `ds.connector_scaffold_request_v1` with:
   - Connector identifier and directory
   - Vendor, service, description
   - List of operations to support
   - The docs bundle from step 1
3. **Run the scaffolder**: Execute `env.connector_scaffold_run_v1` with the prepared request
4. **Apply the plan**: Create all files from the generated `files[]` array
5. **Implement runtime binding**: Add actual HTTP/MCP/other code based on the scaffolded structure

## Generated Files

The scaffolder generates:

- **Data schemas**: `ds.<local>_request_v1.schema.json` and `ds.<local>_result_v1.schema.json` based on operations
- **Envelope(s)**: `env.<local>_run_v1.schema.json` or multiple envelopes for distinct operations
- **Manifest**: `manifest.skill.json` (instance of `ds.skill_descriptor_v1`)
- **Prompt profile**: `impl/prompts/<local>_profile.md` with API calling instructions
- **Runtime binding**: `impl/bindings/<local>_<runtime>_binding_v1.json` (stub, without actual implementation)
- **Documentation**: `SKILL.md` and README files for structure
- **Case example**: `cases/<local>_case_01.json` (optional)
- **Registry/docs snippets**: JSON and markdown fragments for integration

## Constraints

- **No external calls**: The scaffolder never fetches external docs or calls other skills. It only uses information provided in the request.
- **No API fantasies**: All generated content is based only on `source_docs` and `operations`. Missing information results in TODO/notes, not invented details.
- **No code execution**: Runtime bindings are stubs describing API structure, not actual HTTP clients or implementations.
- **MOVA compliance**: All generated schemas and envelopes follow MOVA 4.0.0 patterns.

## MOVA Contracts

- **Input**: `ds.connector_scaffold_request_v1` (via `env.connector_scaffold_run_v1`)
- **Output**: `ds.connector_scaffold_result_v1` (via `env.connector_scaffold_run_v1`)
- **Verb**: `transform`
- **Resource**: `skill`

## Relationship to Other Skills

- **`skill.context7_docs`**: Typically used before this scaffolder to gather API documentation
- **`skill.skill_scaffolder_basic`**: General scaffolder for any skill type; this skill is specialized for connectors

