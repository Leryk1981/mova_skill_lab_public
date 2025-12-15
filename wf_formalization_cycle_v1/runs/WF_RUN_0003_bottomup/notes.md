# WF_RUN_0003_bottomup — participant checklist (v1.1)

- Bottom-up order: evidence first (runs), then minimal ops, then instructions, then procedure.
- Evidence: `event_log.jsonl` has `META(ts_unit)` first and `ctx` on every event.
- Freeze: create `artifacts_snapshot/` and copy artifacts + binding map into it.
- Metrics: final `METRICS_CALC` must exist and `metrics.json` must match it.
- Replay: run deterministic compute with `--metrics-file` and require PASS.
