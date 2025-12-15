# MOVA Skills Lab Snapshot

- Generated at: 2025-12-15T21:44:02.457Z
- Repo root: D:\Projects_Clean\mova_skills_lab_public
- Branch: infra/sqlite-memory-v1
- Commit: c0e2a28b4b4a46bafaa8e94c02c1a9d458eb6cb5
- Node: v22.16.0

## Top-level Layout
- core (dir) — updated 2025-12-14T15:29:24.000Z
- docs (dir) — updated 2025-12-15T20:19:58.306Z
- envelopes (dir) — updated 2025-12-14T15:29:24.000Z
- lab (dir) — updated 2025-12-15T21:11:09.302Z
- node_modules (dir) — updated 2025-12-15T21:43:27.755Z
- package-lock.json (file) — updated 2025-12-15T13:13:22.905Z
- package.json (file) — updated 2025-12-15T21:42:26.968Z
- schemas (dir) — updated 2025-12-14T15:29:24.000Z
- skills (dir) — updated 2025-12-15T20:12:37.073Z
- tools (dir) — updated 2025-12-15T21:41:34.803Z
- wf_formalization_cycle_v1 (dir) — updated 2025-12-14T15:29:24.000Z

## Skills (20)
- code_exec_task_basic
- connector_scaffolder_basic
- context7_docs
- dpp_passport_normalize_basic
- file_cleanup_basic
- mova_check_basic
- mova_lab_operator
- mova_template
- repo_code_change_plan_basic
- repo_snapshot_basic
- runtime_binding_code_scaffolder_basic
- skill_file_cleanup_plan_node_basic
- skill_file_cleanup_snapshot_node_basic
- skill_ingest_run_with_skillseeker_basic
- skill_ingest_store_episode_basic
- skill_mova_ai_bootstrap_generate_basic
- skill_scaffolder_basic
- wf_cycle_compute_compare_basic
- wf_cycle_scaffold_basic
- wf_cycle_winner_pack_basic

## Recently Updated Docs
- docs/lab/LAB_PROTOCOL.md (updated 2025-12-15T21:42:54.636Z)
- docs/lab/LAB_MAP.md (updated 2025-12-15T21:42:35.483Z)
- docs/lab/SKILLS_CATALOG.md (updated 2025-12-15T21:17:49.678Z)
- docs/DPP_WORKFLOW_MANUFACTURER_VERIFIER_L2_03.md (updated 2025-12-15T20:12:37.006Z)
- docs/PROJECT_MEMORY/DECISIONS_DPP_LAB.md (updated 2025-12-15T20:12:37.006Z)
- docs/00_INDEX.md (updated 2025-12-14T15:29:24.000Z)
- docs/01_MOVA_CONSTITUTION.md (updated 2025-12-14T15:29:24.000Z)
- docs/02_LAYERS_RED_YELLOW_GREEN.md (updated 2025-12-14T15:29:24.000Z)
- docs/03_GLOBAL_VOCABULARY.md (updated 2025-12-14T15:29:24.000Z)
- docs/04_ENVELOPE_SPEC.md (updated 2025-12-14T15:29:24.000Z)

## Request Envelope
```json
{
  "envelope_id": "env.repo_snapshot_run_v1",
  "verb": "transform",
  "resource": "note",
  "input": {
    "repo_name": "mova_skills_lab",
    "repo_kind": "mova_lab",
    "preferred_language": "en",
    "snapshot_purpose": "WF_EX_002_smartlink_codex_run_01",
    "raw_notes_from_user": "Snapshot codex-only SmartLink candidate after run 01 (built from textual description) alongside baseline reference in lab/experiments/smartlink_baseline/."
  },
  "meta": {
    "root_path": "D:\\\\Projects_Clean\\\\mova_skills_lab",
    "labels": [
      "mova_skills_lab",
      "WF_EX_002",
      "smartlink",
      "codex_candidate"
    ],
    "domain": "lab_workflow"
  }
}
```

## Available npm scripts
- validate
- test
- smoke:wf_cycle
- init:memory
- memory:import:episodes
- memory:import:decisions
- memory:import
- memory:snapshot
- lab:run
- lab:init
- lab:memory:init
- lab:memory:import
- lab:memory:query
