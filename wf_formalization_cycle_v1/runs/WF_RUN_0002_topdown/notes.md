# WF_RUN_0002_topdown — participant checklist (v1.1)

- Top-down order: procedure → instructions → operations, with explicit gates/fail-branches.
- Evidence: `event_log.jsonl` has `META(ts_unit)` first and `ctx` on every event.
- Freeze: create `artifacts_snapshot/` and copy artifacts + binding map into it.
- Metrics: final `METRICS_CALC` must exist and `metrics.json` must match it.
- Replay: run deterministic compute with `--metrics-file` and require PASS.
