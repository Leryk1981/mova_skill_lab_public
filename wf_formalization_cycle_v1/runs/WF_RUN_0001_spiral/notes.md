# WF_RUN_0001_spiral — participant checklist (v1.1)

- Evidence: append-only `event_log.jsonl` with `META(ts_unit)` first and `ctx` on every event.
- Freeze: create `artifacts_snapshot/` and copy artifacts + binding map into it.
- Gates: emit `GATE` events per phase (snapshot/restore/plan/patch_check/validate/tests/metrics).
- Metrics: final `METRICS_CALC` must exist and `metrics.json` must match it.
- Replay: run deterministic compute with `--metrics-file` and require PASS.
