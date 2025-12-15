# Lab Workflow Pattern: Domain Experiment (v1)

Date: 2025-12-10  
Branch: feature/lab-workflow-experiments-v1  
Scope: LAB layer only (MOVA core remains 4.0.0)  
Actor: codex_vscode_main

---

## 1. Purpose
This pattern describes a single end-to-end lab pass for a domain workflow (e.g., SmartLink, Social Pack, DPP module):
- Start from a baseline domain description (4–N files in an external/adjacent repo).
- Produce a MOVA candidate pack (ds/env + examples) in lab/*.
- Set up an experiment baseline vs MOVA (WF-EX-*), run the first comparison, and capture verdict + recommendations.

---

## 2. Preconditions
- MOVA core: 4.0.0 (unchanged).
- Baseline domain artifacts available (e.g., `lab/experiments/<domain>_baseline/Schemas/*.json`).
- Skills available: repo_snapshot_basic, repo_code_change_plan_basic, mova_check_basic.
- Lab schemas available: ds.lab_workflow_procedure_v1, ds.lab_workflow_experiment_config_v1, ds.lab_workflow_episode_data_v1, ds.lab_workflow_experiment_result_v1.
- Lab envelopes available: env.lab_workflow_experiment_plan_request_v1, env.lab_workflow_variant_generate_request_v1, env.lab_workflow_variant_run_request_v1, env.lab_workflow_experiment_aggregate_request_v1.
- Work only in lab/*; no edits to core/mova.

---

## 3. Single-run checklist for Codex (operator script)
Treat these as sub-steps of one Task (WF_LAB_NN).

### Preparation (WF_LAB_NN_planning)
- Inputs: baseline domain path (`..._baseline/Schemas/`), experiment id (WF-EX-XXX), target branch/dirs.
- Create plan env/run/episode via env.repo_change_plan_run_v1 for traceability.

### A. MOVA candidate pack (WF_LAB_NN_A)
- From baseline files, derive lab schemas/envelopes (minimum: rules/meta/global + 1–2 envelopes) under schemas/lab and envelopes/lab.
- Add examples under lab/examples/.
- Validate via mova_check_basic: create env/run/result/episode for the pack.
- Snapshot (WF_LAB_NN_A) with env/run/episode/doc via repo_snapshot_basic.

### B. Experiment config baseline vs MOVA (WF-EX-XXX_config)
- Create ds.lab_workflow_experiment_config_v1.WF_EX_XXX_<domain>_baseline_vs_mova.json.
- Variants: baseline, candidate_mova.
- Metrics (at least): coverage, clarity_for_operator, runtime_readiness, evolution_flexibility (or user-provided).

### C. Comparative run (WF-EX-XXX_run_01)
- Create ds.lab_workflow_episode_data_v1.WF_EX_XXX_<domain>_run_01.json:
  - Baseline vs candidate summary; per-metric analysis.
  - strengths/weaknesses per variant.
  - gaps_in_candidate (what baseline supports vs candidate lacks).
  - improvement_suggestions (concrete schema/envelope changes).
- Create ds.lab_workflow_experiment_result_v1.WF_EX_XXX_<domain>_baseline_vs_mova_v1.json:
  - Qualitative/normalized metric scores (0.0–1.0).
  - Recommended procedure (baseline/candidate/hybrid).
  - Summary of required improvements for the MOVA pack.

### D. PROGRESS + snapshot (WF_EX_XXX_run_01)
- PROGRESS file: docs/PROJECT_MEMORY/progress/PROGRESS_WF_EX_XXX_<domain>_baseline_vs_mova_run_01.md
  - Domain context, what was compared, verdict per metric, concrete changes for candidate ds/env, next steps.
- Snapshot WF_LAB_NN_B: env/run/episode/doc via repo_snapshot_basic capturing new experiment artifacts.

### E. Git readiness
- Prepare a clean list of files for commit (exclude legacy untracked).
- Suggest commit message; do not commit without operator approval.

---

## 4. SmartLink as applied example
- WF_LAB_08: MOVA SmartLink pack (rules/meta/global + routing envelope + examples + mova_check + snapshot).
- WF_EX_003: baseline SmartLink Schemas vs MOVA pack — result showed baseline covers full workflow (normalize → evaluate → redirect → event) and is more runtime-ready; MOVA pack is cleaner/modular but missing observability/decision/output hooks and resource bindings.
- Verdict: baseline remains reference; MOVA pack should add click-event schema, decision/debug output, normalization guidance, and resource bindings to become canonical.

---

## 5. Notes
- Keep all new artifacts in lab/*; core/mova remains untouched.
- Prefer reuse of existing lab ds/env where possible; only add domain-specific ds/env when unavoidable.
- Always validate (mova_check_basic) and snapshot (repo_snapshot_basic) each major step.
