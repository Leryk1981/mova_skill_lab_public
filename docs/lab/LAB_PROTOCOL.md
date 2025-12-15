# LAB Protocol

## OPERATOR INIT

1. Work only inside the private lab (`D:\Projects_Clean\mova_skills_lab`).
2. Create a feature branch from `main` (e.g., `infra/…`, `feature/…`).
3. Install deps deterministically: `npm ci`.
4. Baseline checks before and after changes: `npm run validate`, `npm test`, `node tools/wf_cycle_smoke_ci.mjs` (or `npm run smoke:wf_cycle` in the mirror).

## REPO SNAPSHOT

- Skill: `skill.repo_snapshot_basic`.
- Inputs: `lab/examples/env.repo_snapshot_request_v1.*.json`.
- Run via `tools/validate_lab.js` or external runner to produce `skills/repo_snapshot_basic/episodes/*.json`.
- Output is a canonical markdown/JSON repo snapshot for project memory.

## SQLITE MEMORY: INIT/IMPORT/QUERY/STATS

- **Canonical path (private only)**: `lab/memory/lab_memory.sqlite` (gitignored)
- **Tool**: `tools/lab_memory.mjs`
- **NPM commands**:
  - `npm run lab:memory:init` — Initialize SQLite database with canonical schema (episodes, decisions tables with search_text field)
  - `npm run lab:memory:import` — Import episodes from multiple sources:
    - `skills/**/episodes/**/*.json`
    - `lab/experiments/**/episodes/**/*.json` (if exists)
    - `lab/skill_runs/**/episode*.json` (if exists)
  - `npm run lab:memory:stats` — Show detailed import statistics (doctor mode):
    - Files found per source pattern
    - Parse errors, invalid shapes, duplicates
    - Database counts after import
    - Writes stats to `lab/memory/stats_runs/<timestamp>_stats.json`
  - `npm run lab:memory:query -- -- --query "<text>" --limit 20` — Query memory with LIKE search across title/summary/tags/skill_id/search_text
- **Search quality**: The `search_text` field includes skill_id, envelope_id/envelope_type, tags, and file path for better search results
- **Public mirror**: All memory commands skip gracefully with clear SKIP messages (no SQLite file created)

### Как проверить что память не пустая

1. **Run stats** to see what was found and imported:
   ```bash
   npm run lab:memory:stats
   ```
   This shows:
   - How many files were found in each source
   - How many were successfully imported
   - How many were skipped and why (parse errors, duplicates, invalid shape)
   - Final database counts

2. **Check database counts** in the stats output:
   - Look for `Database (after import): Episodes: N` — should be > 0 if episodes exist
   - If counts are 0, check the "Skipped" section to see why files weren't imported

3. **Test queries** to verify search works:
   ```bash
   npm run lab:memory:query -- -- --query "repo_snapshot" --limit 5
   npm run lab:memory:query -- -- --query "wf_cycle" --limit 5
   npm run lab:memory:query -- -- --query "dpp" --limit 5
   ```
   If queries return empty results but stats show imported episodes, check that `search_text` field includes relevant terms.

4. **Check stats file** for detailed breakdown:
   - Stats are written to `lab/memory/stats_runs/<timestamp>_stats.json`
   - Review `episodes.errors` array to see specific files that failed to import

## BASELINE GATES

| Gate | Command | Notes |
| --- | --- | --- |
| Validation | `npm run validate` | Schema + manifest consistency. |
| Unit/Integration | `npm test` | Runs validation plus ingest/store/bootstrap/file-cleanup suites. |
| wf_cycle smoke | `node tools/wf_cycle_smoke_ci.mjs` | Scaffold → compare → winner_pack (requires wf_cycle fixtures). |

All three must pass before releasing artifacts or mirroring.

## BRANCH POLICY

- Keep long-lived feature branches per experiment (`feature/dpp-base-pack-v0.1`, `feature/wf-cycle-hardening-smoke-ci`, etc.).
- For infra work, use `infra/*`. Never merge into `main` without a clean commit history + passing gates.
- Public mirror uses dedicated branches (e.g., `feature/dpp-public-pack-v0.1`) with sanitized diffs.

## RUN

Pattern: `env → tool → episode`.

1. Select env/example (`lab/examples/env.*.json` or skill-specific cases).
2. Execute via tool/runner (Node scripts in `skills/*/impl/bindings/*` or CLI wrappers).
3. Capture result as an episode under `skills/<id>/episodes/*.json` or `lab/experiments/**`.

For package-driven runs (e.g., repo snapshot, DPP normalize), follow each skill’s README and case files.

## COMPARE & WINNER PACK

- Skills:
  - `skill.wf_cycle_scaffold_basic` — sets up experiment context.
  - `skill.wf_cycle_compute_compare_basic` — deterministic compare; expects event logs + artifacts.
  - `skill.wf_cycle_winner_pack_basic` — bundles artifacts, bindings, replay evidence.
- Smoke entrypoint: `tools/wf_cycle_smoke_ci.mjs`.
- Outputs live inside `lab/experiments/WF_EX_*` (private) until curated.

## PUBLISH

1. **Export** sanitized JSON/MD from private lab (use `tools/infra_harvest_inventory.mjs` if needed).
2. **Sanitize**: remove `lab/experiments`, `lab/memory`, `lab/skill_runs`, `.tmp`, `.sqlite`.
3. **Mirror branch**: in `mova_skills_lab_public`, create `feature/<topic>-public`, copy curated files, run `npm ci / validate / test / smoke`, commit.
4. **PR** in GitHub and ensure CI (Node pinned via `.nvmrc`, npm 11.6.2) passes before merging.
