# skill.runtime_binding_code_scaffolder_basic

## Purpose

A meta-skill that generates code skeletons and binding files for connecting MOVA skill envelopes to real execution runtimes. It takes a skill description, list of envelopes, and target runtime requirements, then returns code skeleton files that implement the envelope contracts.

## Role in Skills Lab Infrastructure

This skill bridges the gap between **MOVA schemas** and **code execution**:

- **Input**: MOVA skill description + envelope list + runtime requirements
- **Output**: Code skeleton files + optional binding JSON files
- **Purpose**: "MOVA schemas → code skeleton for runtime"

## When to Use

- After creating a MOVA connector skill (e.g., via `skill.connector_scaffolder_basic`) and you need to implement the actual runtime binding code
- When you have a skill with envelopes defined but need code to execute them in a specific runtime (Node.js, Cloudflare Worker, CLI, etc.)
- When you want a consistent code structure for runtime bindings across multiple skills

## How It Works

The skill is executed by an LLM following the prompt profile at `impl/prompts/runtime_binding_scaffolder_profile.md`. The LLM:

1. Receives a `ds.runtime_binding_scaffold_request_v1` with:
   - Target skill identifier and directory
   - Runtime kind (node_script, cloudflare_worker, cli_command, other)
   - Target language (ts/js)
   - List of envelopes to implement
   - Optional binding stub (from `skill.connector_scaffolder_basic`)
   - Optional code style preferences

2. Designs code structure:
   - Functions for each envelope
   - Runtime-specific patterns (async/await, Worker handlers, CLI parsing)
   - Error handling and auth patterns
   - Environment variable usage

3. Generates code skeleton files:
   - Main code entry file
   - Optional binding JSON updates
   - Design notes and checklist

4. Returns a `ds.runtime_binding_scaffold_result_v1` with the file plan

## Typical Flow

The recommended workflow for creating a complete connector:

1. **Generate MOVA connector**: Use `skill.connector_scaffolder_basic` to create the MOVA skill structure (schemas, envelope, manifest, prompt profile, binding stub)

2. **Generate code skeleton**: Use `skill.runtime_binding_code_scaffolder_basic` with:
   - The skill identifier
   - List of envelopes from the connector
   - Target runtime and language
   - The binding stub from step 1

3. **Apply the code**: Create code files from the generated `files[]` array

4. **Complete implementation**: Developer fills in TODOs, adds tests, implements error handling

5. **Test and deploy**: Build, test, and deploy the runtime binding

## Generated Files

The scaffolder generates:

- **Code entry file**: Main runtime code at `code_entry_path` with functions for each envelope
- **Binding JSON** (optional): Updated binding file in `skills/<skill_dir>/impl/bindings/`
- **Design notes**: Markdown explaining code structure and assumptions
- **Checklist**: Steps for the developer to complete the implementation

## Constraints

- **No code execution**: The scaffolder never executes code, accesses the filesystem, or makes network calls
- **No hardcoded secrets**: Always uses environment variables or external configuration
- **Code skeletons only**: Generates structure, not complete implementations (TODOs indicate where work is needed)
- **MOVA compliance**: Generated code respects MOVA envelope contracts

## MOVA Contracts

- **Input**: `ds.runtime_binding_scaffold_request_v1` (via `env.runtime_binding_scaffold_run_v1`)
- **Output**: `ds.runtime_binding_scaffold_result_v1` (via `env.runtime_binding_scaffold_run_v1`)
- **Verb**: `transform`
- **Resource**: `runtime_binding`

## Relationship to Other Skills

- **`skill.connector_scaffolder_basic`**: Typically used before this scaffolder to create the MOVA connector structure and binding stub
- **`skill.skill_scaffolder_basic`**: General scaffolder for any skill type; this skill is specialized for runtime binding code

Together, `skill.connector_scaffolder_basic` + `skill.runtime_binding_code_scaffolder_basic` form a complete pipeline:
- **MOVA-level connector** → **Code-level binding**

