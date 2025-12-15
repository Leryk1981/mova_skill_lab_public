# WF-EX-002 SmartLink — Codex candidate vs baseline (run 01)

## Summary
- Built a Codex-only SmartLink candidate from textual brief (no baseline code access during build). Implemented routing worker, JSON config, simple simulator tests, and README under `lab/experiments/smartlink_codex_candidate/`.
- Snapshot WF_LAB_06 captures state with baseline (reference) and Codex candidate side by side.
- mova_check_basic validated WF-EX-002 procedure/config/plan artifacts; npm test remains green.

## Architecture comparison
- **Baseline**: large monorepo (`lab/experiments/smartlink_baseline/mova_smartlink`) with packages, schemas, worker, admin SPA, CI/CD scripts. Heavy dependency stack, broader surface (KV, Pages, schemas, pipelines).
- **Codex candidate**: lightweight edge worker (`src/router.js`, `src/worker.js`), JSON config in `config/smartlink.sample.json`, console logging only, minimal simulator script. No admin UI or deployment pipeline yet.
- **Config format**: candidate uses simple per-smartlink JSON with destinations, conditions (country/lang/device/source), weights, fallback. Baseline likely richer (schemas, meta), but not inspected deeply.

## Strengths of candidate
- Small footprint; easy to read and reason about routing logic.
- Deterministic condition matching with preference for most specific destination; supports weights and fallback.
- Quick local simulation via `node tests/simulator.js`; minimal setup, no extra deps.

## Strengths of baseline
- Production-ready structure (packages, tests, schemas, deployment scripts).
- Likely better observability, analytics, and validation tooling.
- Broader configurability and integration with MOVA artifacts and CI/CD.

## Risks of trusting candidate fully
- No persistent logging/metrics pipelines (stdout only).
- No admin/config lifecycle; config loading is static JSON.
- No edge deployment wiring (Wrangler/Miniflare) beyond sample entry.
- Condition set limited to country/lang/device/source; geo/device detection is param-based only.

## Metrics (for WF-EX-002, run 01 codex candidate)
- `time_to_solution`: ~120 minutes (design + coding + simulator).
- `files_touched`: 5 (router, worker, README, sample config, simulator).
- `subjective_quality`: 4/5 (clean and minimal, but lacks production tooling and observability).
