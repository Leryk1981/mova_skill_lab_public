WF_LAB_08 — SmartLink MOVA pack (schemas + envelope)
Date: 2025-12-10
Branch: feature/lab-workflow-experiments-v1
Actor: codex_vscode_main

Overview
- Added the first SmartLink MOVA pack in mova_skills_lab: three data schemas (rules/meta/global) and one routing envelope with examples.
- Validated all new artifacts via skill.mova_check_basic (WF_LAB_08) and prepared snapshot artifacts.
- This serves as the candidate MOVA definition for upcoming experiment WF-EX-003 (SmartLink schema baseline vs Codex MOVA pack).

Baseline context
- The baseline SmartLink repository was pruned to a Schemas/ folder with four human-reference artifacts: DS SmartLink Rules, ENV SmartLink Default, Global SmartLink, Meta SmartLink.
- These baseline files are treated as the reference description for SmartLink; no baseline worker/code was modified in this step.

New SmartLink MOVA pack (lab/*)
- ds.smartlink_rules_v1: declarative routing rules per smartlink_id; supports context fields country/lang/device/utm.*, ordered rules with priority/weight, and fallback_target; marked LAB-EXPERIMENTAL and implementation-agnostic.
- ds.smartlink_meta_v1: describes the SmartLink pack (id, name, summary, version) and lists artifacts (dataSchemas, envelopes, instances, globals) plus tags/metadata.
- ds.smartlink_global_v1: global registry of roles/resources/dataSchemas/states/extensions for the SmartLink domain (e.g., roles smartlink_admin/marketing_owner; resources KV rules, edge worker, events queue).
- env.smartlink_default_route_request_v1: envelope for routing requests with smartlink_id, optional rules_ref, and context (country, lang, device, utm.*, referrer, client_ip, debug); pure data contract without Cloudflare/worker specifics.
- All artifacts are LAB-EXPERIMENTAL and stay in the green lab layer; no edge/runtime bindings included.

Validation & snapshot
- mova_check_basic WF_LAB_08 (env.mova_check_run_v1.WF_LAB_08_smartlink_mova_schemas + run/result/episode) validated all new schemas/envelope with their examples — status: ok.
- Snapshot captured: docs/PROJECT_MEMORY/PROJECT_SNAPSHOT_2025-12-10_mova_skills_lab_WF_LAB_08_smartlink_mova_schemas.json (episode: skills/repo_snapshot_basic/episodes/episode_2025-12-10_mova_skills_lab_WF_LAB_08_smartlink_mova_schemas.json).

Next steps
1) Stand up experiment WF-EX-003: SmartLink baseline Schemas (human reference) vs Codex MOVA pack.
2) Author ds.lab_workflow_experiment_config_v1 for WF-EX-003 (baseline vs candidate).
3) Add episode_data instances for baseline and candidate runs; define envs for variant runs if needed.
4) Create ds.lab_workflow_experiment_result_v1 for initial comparison once runs/metrics are set.
