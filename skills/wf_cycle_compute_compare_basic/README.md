# `skill.wf_cycle_compute_compare_basic`

Deterministically compares two `wf_cycle` v1.1 runs (typically `codex_ide` vs `codex_cli`) and writes a canonical compare folder:

- `inputs.md`
- `metrics_computed_<label>.json` (e.g. `metrics_computed_codex_ide.json`)
- `score_computed.json`
- `winner.md`
- `delta_summary.md`

## Guardrails

- Must not write to `lab/memory/**`.
- Enforces wf_cycle v1.1 canon:
  - `event_log.jsonl` first line is `{"type":"META","ts_unit":"s"}`
  - every non-META event has `ctx`
  - last non-empty line is `METRICS_CALC`
  - `metrics.json` equals latest `METRICS_CALC` (configurable via `fail_on_metrics_mismatch`)
  - legacy note: missing `ctx` on `METRICS_CALC` is tolerated with a warning (to support older runs), but all other events require `ctx`

## Usage (direct)

```bash
node skills/wf_cycle_compute_compare_basic/impl/bindings/node/compute_compare.mjs \
  --request-file skills/wf_cycle_compute_compare_basic/cases/case_WF_EX_WF_BUILD_WORKFLOW_001_B_topdown.json
```

Expected: creates `lab/experiments/WF_EX_WF_BUILD_WORKFLOW_001/compare/B_topdown_skill/*` and prints a JSON result with `status="ok"`.

## Request schema

See `skills/wf_cycle_compute_compare_basic/mova/ds/ds.wf_cycle_compare_request_v1.schema.json`.

## IC source of truth

- `ic_value` is always recomputed from `event_log.jsonl` (ctx switches / span) per wf_cycle v1.1.
- `metrics.json` IC is informational; mismatches produce `ic_mismatch=true` + warning (no immediate FAIL).

## inputs.md portability

- Compare inputs are written relative to the repository root whenever possible (`paths_style: relative` or `mixed`).
- This makes compare folders portable across machines (only non-relative paths are explicitly marked `(absolute)`).

## Result warnings

- `warnings` are included in the JSON result (and mirrored in `winner.md`) so consumers notice drifts such as IC mismatches without opening the compare folder.
