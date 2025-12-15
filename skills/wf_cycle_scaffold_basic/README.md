# `skill.wf_cycle_scaffold_basic`

Bootstrap a wf_cycle experiment scaffold (rules, inputs, and A/B/C participant zones) in a single deterministic pass.

## Guardrails
- Never touch `lab/memory/**` or `core/**`.
- All writes stay inside the provided `experiment_dir`.
- Safe mode (default) skips existing files and logs warnings.

## Usage
```bash
node skills/wf_cycle_scaffold_basic/impl/bindings/node/scaffold_experiment.mjs \
  --request-file skills/wf_cycle_scaffold_basic/cases/case_WF_EX_WF_SCAFFOLD_SMOKE_001.json
```

## Request schema
`skills/wf_cycle_scaffold_basic/mova/ds/ds.wf_cycle_scaffold_request_v1.schema.json`

## Outputs
- Ensures `rules/`, `inputs/`, `compare/`, `outputs/`, `logs/`.
- Creates `attempts/<participant>/wf_cycle/{artifacts, bindings, runs/A|B|C}`.
- Copies wf_cycle templates (artifacts, run evidence) per participant.
- Writes participant briefs and `logs/setup_scaffold.log`.
- Returns ds.wf_cycle_scaffold_result_v1 (status, warnings, paths_written/skipped).

