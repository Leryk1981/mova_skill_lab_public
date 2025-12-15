# WF Formalization Cycle v1 — Starter Pack

Date: 2025-12-13

Lab-ready starter pack to compare workflow formalization cycles:
- A: Top-Down (Method-first)
- B: Bottom-Up (Ops-first)
- C: Spiral (Bidirectional / risk-driven)

## v1.1 changes (canonized from WF_EX_WF_BUILD_WORKFLOW_001)

- `event_log.jsonl` canon: `META(ts_unit)` first, `ctx` on every event, `METRICS_CALC` required and treated as last truth.
- `metrics.json` integrity: must equal the latest `METRICS_CALC` (otherwise FAIL).
- `artifacts_snapshot/` required per run for reproducibility.
- Deterministic replay required (`tools/compute_metrics_from_artifacts.mjs --metrics-file ...` must PASS).
- ID stability rule after the first closed loop (no renames).

See: `METHOD_CANON_v1_1.md`

## Structure
- `artifacts/` — canonical artifacts (Method / Procedures / Instructions / Operations)
- `runs/` — run folders with `event_log.jsonl` + `metrics.json` + `scorecard.json`
- `sources/` — primary/normative bibliography only

## Minimal usage
1) Pick a real workflow and copy `runs/WF_RUN_0001_spiral/` into a new run folder.
2) Edit artifacts so bindings are real:
   - Procedure node → Instruction id
   - Instruction step → Operation id
3) Append events to `event_log.jsonl` (JSON Lines) while you work.
4) Freeze a snapshot (`runs/<run>/artifacts_snapshot/`) once the loop is “closed”.
5) Compute metrics (E/V/S/IC/TFR) deterministically and sync `metrics.json` + final `METRICS_CALC`.
6) Verify PASS via deterministic replay (`--metrics-file`) + diff-guard.
5) Repeat for A/B/C and compare.

## Modeling rules
- MOVA describes processes; it does not invent semantics.
- Instruction atomicity is NOT assumed. Use `consistency_model`:
  - `none` | `best_effort` | `compensating` | `transactional`

## Tools

See `tools/README.md`.
