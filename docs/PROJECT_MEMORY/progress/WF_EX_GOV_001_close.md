# WF_EX_GOV_001 — close

## Summary

WF_EX_GOV_001 зафіксував overlay-only інтеграцію Governance Pack v1 (MOVA 4.1.1) як самодостатні “attempts”, що локально вантажать core + compat + pack schemas та валідять приклади governance.

## Attempts + winner

Спроби:
- `lab/experiments/WF_EX_GOV_001/attempts/qwen/`
- `lab/experiments/WF_EX_GOV_001/attempts/codex_cli/`
- `lab/experiments/WF_EX_GOV_001/attempts/codex_ide/`

Winner (канонічний підхід для overlay validation) = `attempts/codex_ide`:
- Ajv2020 validation
- мінімальний compat (лише потрібні залежності 4.1.1)
- явний контрактний mapping example → schema (`envelope_id`/`schema_id` → `$id` URL)

## What’s integrated vs overlay-only

- Підхід залишився overlay-only (без змін `core/mova/**`).
- Governance pack артефакти розміщено в `lab/packs/governance_pack_v1_4.1.1/` для подальшого використання валідаторами/рантаймами.

## Artifacts

- Compare report: `docs/PROJECT_MEMORY/progress/WF_EX_GOV_001_R1_compare.md`
- Plans: `lab/skill_runs/repo_change_plan.WF_EX_GOV_001A_overlay.json`, `lab/skill_runs/repo_change_plan.WF_EX_GOV_001B_core_patch.json`
- Baseline snapshot/episode artifacts for GOV-001 were captured under `lab/skill_runs/`, `docs/PROJECT_MEMORY/`, `skills/repo_snapshot_basic/episodes/`.

## Memory sync

After closing experiments, ran memory import + snapshot:
- totals: episodes=22, decisions=2
- snapshot: `lab/memory/SQLITE_MEMORY_SNAPSHOT_20251212_133125.json`
