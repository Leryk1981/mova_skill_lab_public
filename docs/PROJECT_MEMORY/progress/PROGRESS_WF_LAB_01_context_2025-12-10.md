# WF_LAB_01 Context (2025-12-10)

MOVA Skills Lab stays on MOVA 4.0.0 core: red layer schemas/envelopes in `core/mova` unchanged; skills registry lists the infrastructure set (repo_snapshot_basic, repo_code_change_plan_basic, skill_ingest_* pipeline, mova_ai_bootstrap_generate_basic, connector/runtime scaffolder, context7_docs, file_cleanup nodes). Validation and tests run clean via `npm test`.

Recent DPP lab activity (per SQLite snapshots up to episode_2025-12-09_dpp_after_L3_03_normalize_export_verifier_workflow) covered L3_01–L3_03 normalization steps and repo snapshots/change-plan episodes. Decisions on cobalt-only materials and optional external_sources remain recorded as DPP-LAB-DEC-0001/0002. Memory import tooling is referenced but missing (`lab/tools/import_episodes_to_sqlite.js`), so the latest state is captured through existing SQLite files and manual snapshots.

Workflow lab focus: docs `docs/lab_workflow_experiment_*` define the lab layer (green) for experimenting with workflow procedures, configurations, variant generation/runs, and aggregation; core must stay untouched. WF_LAB_01 aims to add lab-level schemas/envelopes for these experiments, branch from main into `feature/lab-workflow-experiments-v1`, and prepare planning/snapshot artifacts for upcoming WF-EX-001 without altering MOVA 4.0.0 contracts.
