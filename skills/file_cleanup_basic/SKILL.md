# skill.file_cleanup_basic

> **Status: experimental / lab-only**  
> This skill was created mainly to test the scaffolder pipeline and is not meant for regular use. Existing tools (like WinDirStat, TreeSize, etc.) are usually a better fit for real disk cleanup.

## Purpose

An LLM-only skill that helps plan intelligent cleanup of a single local disk or partition. The skill analyzes a snapshot of the disk structure (folders, sizes, file types) and generates a safe, structured cleanup plan without ever accessing the real filesystem.

## When to Use

- When you need to free up disk space and want a structured plan before taking action
- When analyzing disk usage patterns and identifying potential cleanup opportunities
- When planning disk maintenance with clear risk assessment
- Before performing manual cleanup to ensure important data is protected

## How It Works

The skill is executed by an LLM following the prompt profile at `impl/prompts/file_cleanup_profile.md`. The LLM:

1. Receives a `ds.file_cleanup_request_v1` with:
   - Disk snapshot (text dump of folder structure with sizes)
   - User preferences (target free space, protected paths, risk tolerance)
   - Optional metrics and summaries

2. Analyzes the snapshot and identifies:
   - Safe deletion candidates (cache, temp files, known junk)
   - Optional deletions (needs review)
   - Items to archive or move
   - Items requiring manual inspection

3. Generates a structured cleanup plan with:
   - Overview of current state and goals
   - Categorized actions with risk levels
   - Step-by-step checklist for safe execution

## Key Features

- **Conservative by default**: Clearly separates safe junk from risky areas
- **Respects user constraints**: Never suggests deleting protected paths
- **Risk assessment**: Each action has a risk level (low/medium/high)
- **No filesystem access**: Works only from textual snapshots, never touches real files
- **Future-proof design**: Schemas designed to easily plug in connectors for automatic snapshot generation

## Constraints

- **No filesystem access**: The skill never reads, writes, or deletes files. It only works from textual snapshots.
- **LLM-only**: No external HTTP requests, MCP calls, or local scripts.
- **Conservative approach**: When uncertain, marks items for manual inspection rather than suggesting deletion.

## MOVA Contracts

- **Input**: `ds.file_cleanup_request_v1` (via `env.file_cleanup_run_v1`)
- **Output**: `ds.file_cleanup_result_v1` (via `env.file_cleanup_run_v1`)
- **Verb**: `transform`
- **Resource**: `note`

## Future Enhancements

The skill is designed to be extended with:
- Connectors that automatically generate disk snapshots (e.g., via system tools)
- Executors that apply the cleanup plan (with user confirmation)
- Integration with backup systems to ensure safety

