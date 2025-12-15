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

## SQLITE MEMORY: INIT/IMPORT/QUERY

- **Canonical path (private only)**: `lab/memory/lab_memory.sqlite` (gitignored)
- **Tool**: `tools/lab_memory.mjs`
- **NPM commands**:
  - `npm run lab:memory:init` — Initialize SQLite database with canonical schema (episodes, decisions tables)
  - `npm run lab:memory:import` — Import episodes from `skills/**/episodes/**/*.json` and decisions from `lab/decisions/**/*.json`
  - `npm run lab:memory:query -- -- --query "<text>" --limit 20` — Query memory with LIKE search across title/summary/tags/skill_id
- **Integration**: `lab:init` automatically runs init/import/query during context restore step
- **Public mirror**: All memory commands skip gracefully with clear SKIP messages (no SQLite file created)

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

## LAB:INIT (NEW CHAT BOOTSTRAP)

- Kick off new analysis with `npm run lab:init -- --query "<focus>"` (default query is `infra`).
- The runner writes snapshot/context/baseline logs under `lab/init_runs/<YYYY-MM-DD_HH-mm-ss>/`.
- **Repo snapshot**: Executes the node CLI for `skill.repo_snapshot_basic` (stores artifacts in `lab/repo_snapshot_runs/<ts>`).
- **Context restore**: Uses `lab_memory.mjs` to restore experience from SQLite:
  - If `lab/memory/lab_memory.sqlite` is missing → runs `lab:memory:init`
  - Then runs `lab:memory:import` to index current episodes/decisions
  - Then runs `lab:memory:query` with the provided query (default: "infra", limit: 20)
  - Writes `context_restore.json` and `context_restore.md` to `<out>/context/`
  - In public mirror: skips with clear SKIP message (no SQLite available)
- **Baseline gates**: Always run `npm run validate` + `npm test`. `--public` (or CI+smoke script) also runs `npm run smoke:wf_cycle`.

## HOW TO RUN A SKILL

- Use the unified runner: `npm run lab:run -- --case <path>` or `npm run lab:run -- --env <path>`.
- `--case` auto-detects skills under `skills/<skill_dir>/cases`. `--env` maps prefixes like `lab/examples/env.dpp_passport_normalize_run_v1.*.json`.
- Optional `--skill <skill_id>` forces the mapping when both case and env overlap.
- Node-backed skills run automatically (wf_cycle, dpp normalize). LLM/manual skills print precise binding/profile instructions and exit `PASS (manual)`.

Examples:

```bash
npm run lab:run -- --case skills/wf_cycle_compute_compare_basic/cases/case_WF_EX_WF_BUILD_WORKFLOW_001_B_topdown.json
npm run lab:run -- --env lab/examples/env.dpp_passport_normalize_run_v1.dpp_lab.example.json
npm run lab:run -- --skill skill.repo_code_change_plan_basic --case skills/repo_code_change_plan_basic/cases/repo_code_change_plan_basic_case_01.json
```

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
