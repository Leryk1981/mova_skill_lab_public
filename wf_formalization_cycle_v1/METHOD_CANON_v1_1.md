# WF Formalization Cycle v1.1 — Method Canon (required rules)

## Evidence log: `event_log.jsonl`

- First line MUST be a META event specifying time units:
  - `{"type":"META","ts_unit":"s"}`
- Every subsequent event MUST include `ctx`:
  - `ctx ∈ {"bindings","artifacts","runs"}`
- `METRICS_CALC` MUST exist and MUST be the last “truth” entry:
  - append-only log; do not edit old lines
  - you may append a placeholder `METRICS_CALC` during work, but the final `METRICS_CALC` must reflect computed values

## Metrics consistency

- `metrics.json` MUST match the latest `METRICS_CALC` in `event_log.jsonl`.
- If `metrics.json` != latest `METRICS_CALC` → FAIL (evidence ambiguity).

## Run folder freeze: `artifacts_snapshot/`

- Every run MUST have `runs/<run>/artifacts_snapshot/`.
- Snapshot contents:
  - `artifacts/operations.json`
  - `artifacts/instructions.json`
  - `artifacts/procedure.json`
  - binding map (domain-specific, e.g. `bindings/*_binding_map.md`)
- Purpose: reproducibility (future attempts must not mutate the past run’s truth).

## Phase gates (required)

- Emit explicit `GATE` events for phases (at minimum):
  - snapshot
  - restore (read-only)
  - plan
  - patch_check
  - validate
  - tests
  - metrics
- Each gate is a boolean PASS/FAIL statement tied to a concrete evidence file/log.

## ID stability rule

- After the first “closed loop” is achieved (ops → instructions → procedure + evidence loop):
  - no renames of `op_id` / `instr_id` / `procedure_id`
  - only additive edits or clarifications are allowed

## Deterministic replay (required)

- Deterministic metric replay MUST PASS:
  - compute metrics from `artifacts/*.json` + `event_log.jsonl`
  - enforce integrity via `--metrics-file` (must match latest `METRICS_CALC`)

