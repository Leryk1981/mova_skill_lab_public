# skill.repo_code_change_plan_basic

## Purpose

A meta-skill that generates structured, step-by-step plans for code changes in a repository. It takes a repository snapshot, goal description, and constraints, then produces a detailed plan of what files to change, in what order, with risks and completion criteria.

## What This Skill Does

- **Analyzes** repository context from a snapshot (typically from `skill.repo_snapshot_basic`)
- **Plans** code changes based on a goal description
- **Structures** the plan into clear, ordered steps
- **Assesses** risks and provides completion criteria
- **Respects** constraints (must_not_touch paths, preferred areas)

## What This Skill Does NOT Do

- **Does not modify files** – it only generates a plan
- **Does not execute commands** – it does not run tests, builds, or deployments
- **Does not guarantee completeness** – it's a planning tool, not a perfect oracle
- **Does not write code** – it describes what needs to be done, not how to do it

## Typical Workflow

1. **Create repository snapshot**: Use `skill.repo_snapshot_basic` to get a structured snapshot of the repository

2. **Formulate goal**: Write a clear `goal_summary` describing what needs to be accomplished (3–10 lines)

3. **Set constraints**: Specify:
   - `must_not_touch`: Paths that must not be modified (e.g., `"core/mova/**"`)
   - `preferred_areas`: Where to concentrate changes (e.g., `"skills/connectors_*"`)
   - `constraints_md`: Additional constraints in human-readable format

4. **Generate plan**: Call `env.repo_change_plan_run_v1` with the snapshot, goal, and constraints

5. **Execute plan**: Manually or with other tools, execute the steps in dependency order

6. **Verify**: Use `done_criteria_md` from each step to verify completion

## Example Use Cases

- **Adding a new connector**: Plan the creation of a new MOVA connector skill using the scaffolding pipeline
- **Updating existing skill**: Plan modifications to an existing skill (new features, bug fixes)
- **Infrastructure changes**: Plan changes to build system, CI/CD, or tooling
- **Documentation updates**: Plan documentation improvements across the repository
- **Test coverage**: Plan adding tests for existing functionality

## Plan Structure

The generated plan includes:

- **High-level overview**: 1–3 paragraphs summarizing the approach
- **Steps**: Ordered list of changes, each with:
  - Clear identifier (`S1`, `S2`, etc.)
  - Title and summary
  - Change kind (create_file, modify_file, etc.)
  - Target files with paths and roles
  - Dependencies on other steps
  - Risk assessment
  - Completion criteria
- **Global risks**: Overall risks for the entire plan
- **Checklist**: Actionable items for the developer

## MOVA Contracts

- **Input**: `ds.repo_change_plan_request_v1` (via `env.repo_change_plan_run_v1`)
- **Output**: `ds.repo_change_plan_result_v1` (via `env.repo_change_plan_run_v1`)
- **Verb**: `transform` (transforming context and goal into a plan)
- **Resource**: `code_change_plan`

## Relationship to Other Skills

This skill completes the infrastructure pipeline:

1. **`skill.repo_snapshot_basic`** → creates repository snapshot
2. **`skill.repo_code_change_plan_basic`** → **generates change plan** (this skill)
3. **`skill.connector_scaffolder_basic`** → creates MOVA connector structure
4. **`skill.runtime_binding_code_scaffolder_basic`** → generates code skeleton
5. **`skill.code_exec_task_basic`** → executes code (tests, builds, deploys)

Together, they form a complete cycle:
**"Repository context → change plan → MOVA connector → code binding → standardized code execution"**

## Episode Policy

The skill uses `episode_policy.mode: "none"` because planning steps are typically not recorded. Plans are meant to be executed, not stored as episodes.

