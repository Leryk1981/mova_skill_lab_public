# wf_formalization_cycle_v1/tools

## compute_metrics_from_artifacts.mjs

Deterministically computes `E/V/S/IC/TFR` (and `score`) from:

- `artifacts/operations.json`
- `artifacts/instructions.json`
- `artifacts/procedure.json`
- `runs/<run>/event_log.jsonl`

Integrity mode (required for “PASS”): provide `--metrics-file` to enforce:

- `META(ts_unit)` exists
- final `METRICS_CALC` exists
- `metrics.json` == latest `METRICS_CALC`

Example:

```bash
node wf_formalization_cycle_v1/tools/compute_metrics_from_artifacts.mjs \
  --ops MY_EXPERIMENT/attempts/codex_cli/wf_cycle/artifacts/operations.json \
  --instructions MY_EXPERIMENT/attempts/codex_cli/wf_cycle/artifacts/instructions.json \
  --procedure MY_EXPERIMENT/attempts/codex_cli/wf_cycle/artifacts/procedure.json \
  --event-log MY_EXPERIMENT/attempts/codex_cli/wf_cycle/runs/B_topdown/event_log.jsonl \
  --metrics-file MY_EXPERIMENT/attempts/codex_cli/wf_cycle/runs/B_topdown/metrics.json \
  --out MY_EXPERIMENT/attempts/codex_cli/wf_cycle/runs/B_topdown/metrics_computed_replay.json \
  --label replay:B_topdown
```

## check_diff_allowed

Scope guard to ensure you only change allowed paths.

Linux/macOS (bash):

```bash
./wf_formalization_cycle_v1/tools/check_diff_allowed.sh lab/experiments/MY_EXPERIMENT/
```

Windows (PowerShell):

```powershell
pwsh -NoProfile -File wf_formalization_cycle_v1/tools/check_diff_allowed.ps1 -AllowedPrefix "lab/experiments/MY_EXPERIMENT/"
```

If your repo has pre-existing untracked files outside the experiment, create a baseline file listing them and pass it as the second argument (bash) / `-BaselineUntrackedFile` (pwsh).
