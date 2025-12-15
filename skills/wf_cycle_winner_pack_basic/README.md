# `skill.wf_cycle_winner_pack_basic`

Builds a wf_cycle v1.1 winner pack (artifacts + evidence + compare) in one deterministic run.

## Guardrails
- Read-only: canonical wf_cycle inputs, `core/**`, `lab/memory/**`.
- Writes restricted to experiment folders passed via the request.
- Creates / reuses `artifacts_snapshot` inside the winner run.

## Usage
```bash
node skills/wf_cycle_winner_pack_basic/impl/bindings/node/build_winner_pack.mjs \
  --request-file skills/wf_cycle_winner_pack_basic/cases/case_WF_EX_WF_BUILD_WORKFLOW_001_pack_from_B_topdown.json
```

## Request schema
See `skills/wf_cycle_winner_pack_basic/mova/ds/ds.wf_cycle_winner_pack_request_v1.schema.json`.

## Outputs
- `outputs/winner_pack/` (or custom path): artifacts snapshot, binding map, run evidence, rules, compare copies.
- README summarising winner + reproduction steps.
- Optional `replay_check.log` proving deterministic metrics recompute succeeded.

## Result schema
`skills/wf_cycle_winner_pack_basic/mova/ds/ds.wf_cycle_winner_pack_result_v1.schema.json`
