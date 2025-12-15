WF-EX-003 — SmartLink MOVA vs baseline (run_01)
Date: 2025-12-10
Branch: feature/lab-workflow-experiments-v1
Actor: codex_vscode_main

What we compared
- Baseline SmartLink Schemas (4 artifacts: Rules, Default env, Global, Meta) from lab/experiments/smartlink_baseline/Schemas/ (read-only reference).
- MOVA SmartLink pack from WF_LAB_08 (ds.smartlink_rules_v1 / ds.smartlink_meta_v1 / ds.smartlink_global_v1 + env.smartlink_default_route_request_v1 and examples).

Findings per axis
- workflow_coverage: Baseline captures full chain (normalize → evaluate → redirect → emit event). MOVA covers rule matching and request payload but lacks explicit decision/output and observability event contract.
- clarity_for_operator: MOVA pack is cleaner and runtime-agnostic; baseline Default env mixes plugins/steps and is less self-contained, but shows intent clearly.
- runtime_readiness: Baseline closer to deployable (KV/worker/queue hooks). MOVA lacks click-event schema and decision output, so wiring to runtime would require ad-hoc extensions.
- evolution_flexibility: MOVA meta/global separation is easier to extend; baseline is tied to a specific stack but already encodes priority/weight/time windows and observability intent.

Verdict
- MOVA SmartLink pack is clearer and more modular but cannot fully replace baseline until observability and decision/output contracts are added.
- Recommended procedure for now: baseline_schemas remain reference; MOVA pack should be upgraded before becoming canonical.

Concrete changes needed for MOVA pack
- Add a click/redirect event schema (e.g., ds.smartlink_click_event_v1) and optionally an envelope to emit it.
- Extend env.smartlink_default_route_request_v1 to optionally return the decision (selected rule/branch/target) for debug/test flows and acknowledge start/end windows.
- Document normalization expectations (country/lang/device/utm parsing) and rule evaluation semantics, possibly via helper schema or meta.
- Clarify resource bindings in meta/global (KV/queue/worker) so runtime wiring mirrors baseline ops needs.

Artifacts produced in run_01
- Experiment config: lab/examples/ds.lab_workflow_experiment_config_v1.WF_EX_003_smartlink_mova_vs_baseline.json
- Episode data: lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_003_smartlink_mova_compare_run_01.json
- Experiment result: lab/examples/ds.lab_workflow_experiment_result_v1.WF_EX_003_smartlink_mova_vs_baseline_v1.json
