# skill.repo_snapshot_basic

## Purpose

A universal LLM-only skill that helps create standardized snapshots of any repository. The skill accepts raw repository data (structure dump, README, notes) and produces:

1. **`project_snapshot_md`** – comprehensive markdown snapshot with fixed section structure
2. **`global_memory_md`** – condensed summary (3-10 bullet points) suitable for global memory
3. **`checklist_for_human`** – markdown list of actions for the human

## When to Use

- Before switching chat contexts to preserve repository understanding
- When onboarding to a new repository
- When creating status update snapshots for documentation
- When establishing initial context for a new LLM session

## How It Works

The skill is executed by an LLM following the prompt profile at `impl/prompts/repo_snapshot_profile.md`. The LLM:

1. Receives a `ds.repo_snapshot_request_v1` with raw repository data
2. Follows the structured instructions in the prompt profile
3. Generates the three output fields without external calls

## Constraints

- **No external calls**: No HTTP requests, MCP calls, or local scripts
- **LLM-only**: Relies entirely on the LLM's understanding of the input data
- **Structured output**: Always follows the fixed markdown structure defined in the prompt profile

## MOVA Contracts

- **Input**: `ds.repo_snapshot_request_v1` (via `env.repo_snapshot_run_v1`)
- **Output**: `ds.repo_snapshot_result_v1` (via `env.repo_snapshot_run_v1`)
- **Verb**: `transform`
- **Resource**: `note`

