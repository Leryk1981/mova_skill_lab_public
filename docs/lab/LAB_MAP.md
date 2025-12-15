# LAB Map

## Worlds

- **Private Lab** — `D:\Projects_Clean\mova_skills_lab`
  - Contains full experimental history, SQLite memory, diagnostic artifacts, and harvested docs.
  - Never add a remote; all work stays local until sanitized.
- **Public Mirror** — `D:\Projects_Clean\mova_skills_lab_public` / GitHub `Leryk1981/mova_skill_lab_public`
  - Receives curated contracts/docs/tools only.
  - Forbidden payloads: `lab/experiments/**`, `lab/memory/**`, `lab/skill_runs/**`, `tmp/**`, `**/.tmp/**`, `*.sqlite`.

## Repository Layout

| Path | Description / Notes |
| --- | --- |
| `core/` | MOVA red-core schemas, envelopes, vocab. Immutable reference for all skills. |
| `skills/` | Yellow-layer skills (manifests, schemas, episodes, bindings). Look for `impl/`, `cases/`, and `README.md`. |
| `lab/` | Green-layer registry (`lab/skills_registry_v1.json`), examples, experiments, packs, tools, memory snapshots. |
| `docs/` | Canon + project memory. Drafts live under `docs/_drafts`. Use `docs/lab/*` for canonical operator docs. |
| `tools/` | Node utilities (`validate_lab.js`, `wf_cycle_smoke_ci.mjs`, `infra_harvest_inventory.mjs`, etc.). |
| `package.json` | Scripts (`npm run validate`, `npm test`) and dependency lock. |

## Sources of Truth

- **Main branch** (`infra/harvest-inventory-v1` derived from `main`) — baseline for contracts.
- **Registry** — `lab/skills_registry_v1.json` enumerates skills and bindings.
- **Entry scripts** — package scripts + `tools/*.js|mjs` (e.g., `tools/validate_lab.js`, `tools/wf_cycle_smoke_ci.mjs`, `lab/tools/import_*`).
- **Experiments** — canonical runbooks live in `lab/experiments/**` (private only).
- **SQLite memory** — Canonical memory path (private only): `lab/memory/lab_memory.sqlite` (gitignored). Dated JSON snapshots also capture project context (never publish).

## Red Flags / Sensitive Paths

- `lab/experiments/**`
- `lab/memory/**`, `lab/memory/*.sqlite`, `lab/tools/import_*_to_sqlite.js`
- `lab/skill_runs/**`
- `tmp/**`, `**/.tmp/**`
- `docs/_drafts/**` (harvested branch-specific material)
- Any file ending with `.sqlite` or containing embeded logs (e.g., `event_log.jsonl`)
