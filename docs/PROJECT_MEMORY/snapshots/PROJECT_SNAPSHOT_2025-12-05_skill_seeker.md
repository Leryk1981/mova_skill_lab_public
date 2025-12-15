# Skill Seeker — Repository Snapshot (2025-12-05)

## Overview
Skill Seeker turns documentation websites, GitHub repositories, and PDFs into production-ready Claude skills. It scrapes sources (with llms.txt fast paths), detects documentation/code gaps via AST-based code analysis, and builds categorized references plus an enhanced `SKILL.md`, finishing with a Claude-ready `.zip`.
The tool targets both CLI users and Claude Code (MCP) workflows: presets cover common frameworks (React, Godot, Django, FastAPI, etc.), async mode speeds up large jobs, and unified configs merge multiple sources with conflict detection. Optional AI enhancement can run locally (Claude Code Max) or via API.

## Key concepts & pipeline
- Sources: documentation sites (HTML, llms.txt), GitHub repos (issues, releases, AST API extraction for multiple languages), PDFs (text/code/image/table/OCR/password support).
- Pipeline (typical): detect llms.txt → scrape/crawl (sync or async) → code analysis & conflict detection (docs vs code signatures/descriptions) → categorize references → AI enhancement (local/API) → package into Claude skill `.zip`; supports unified multi-source merge and router/hub skills for very large docs.
- User interfaces: unified CLI (`skill-seekers ...`), individual subcommands (scrape/github/pdf/unified/enhance/package/upload/estimate), MCP server tools for Claude Code, optional automated upload.

## Repository structure
- `.claude/`, `.github/`, `.vscode/` — Claude/MCP prompts, GitHub workflows/templates, VS Code settings.
- `configs/` — preset configs for docs/GitHub/unified/PDF (godot, react, django, fastapi, kubernetes, ansible-core, tailwind, claude-code, etc.).
- `docs/` — deep guides: architecture (`CLAUDE.md`), enhancement, large docs, unified scraping, PDF research/flows, MCP setup/testing, upload, terminal selection; plans/roadmaps under `docs/plans/`.
- `src/skill_seekers/` — package code: `cli/` (doc_scraper, github_scraper, pdf_scraper, unified_scraper, merge_sources, conflict_detector, code_analyzer, llms_txt detectors, estimate_pages, enhance_skill[_local], package_skill, upload_skill, split_config, generate_router, quality_checker, utils, main CLI entry) and `mcp/` (MCP server, tools, README).
- `tests/` — extensive pytest suite covering CLI paths, configs, async/parallel scraping, llms.txt handling, GitHub scraping, PDF features, MCP server/tools, packaging, terminal detection; fixtures folder plus integration docs.
- Root files: `README.md`, `QUICKSTART.md`, `BULLETPROOF_QUICKSTART.md`, `ASYNC_SUPPORT.md`, `ROADMAP.md`/`FLEXIBLE_ROADMAP.md`, `TROUBLESHOOTING.md`, `CLAUDE.md`, `demo_conflicts.py`, `example-mcp-config.json`, `setup_mcp.sh`, `pyproject.toml`, `requirements.txt`, `CHANGELOG.md`, `LICENSE`, `mypy.ini`.
- (Git-ignored) `output/` — generated data (`{name}_data/`), skills (`{name}/`), packaged zips.

## Execution model
- Primary CLI: `skill-seekers` (console script via `skill_seekers.cli.main`). Common flows: `skill-seekers scrape --config configs/<preset>.json [--async --workers N --enhance-local|--enhance --skip-scrape]`, `skill-seekers github --repo owner/name` or `--config configs/react_github.json`, `skill-seekers pdf --pdf file.pdf` or `--config configs/example_pdf.json`, `skill-seekers unified --config configs/<name>_unified.json`, `skill-seekers package output/<name>/ [--upload]`, `skill-seekers upload output/<name>.zip`, `skill-seekers estimate configs/<name>.json`.
- Config-driven behavior: configs define name/description, selectors, include/exclude URL patterns, categories, rate limits, max pages, merge strategies (for unified), GitHub options, PDF flags, checkpoints, async/parallel options.
- MCP integration: `setup_mcp.sh` plus `example-mcp-config.json` wire Claude Code to `src/skill_seekers/mcp/server.py`; MCP tools wrap CLI (generate_config, estimate_pages, scrape_docs, package/upload_skill, list/validate configs, split_config, generate_router, scrape_pdf).
- Output: raw scrape cached in `output/<name>_data/` (pages JSON, summary); built skill in `output/<name>/` (`SKILL.md`, `references/`, scripts/assets placeholders); packaged as `output/<name>.zip`; router and multi-package helpers for split configs.

## Configuration & presets
- Presets in `configs/`: docs-only (react.json, vue.json, django.json, fastapi.json, kubernetes.json, tailwind.json, ansible-core.json, astro.json, claude-code.json), GitHub-only (react_github.json, godot_github.json), unified (react_unified.json, django_unified.json, fastapi_unified.json, godot_unified.json, fastapi_unified_test.json), PDF examples (example_pdf.json), large-doc samples (godot-large-example.json), misc tests (python-tutorial-test.json, test-manual.json, hono.json, laravel.json, steam-economy-complete.json).
- Env variables: `ANTHROPIC_API_KEY` (API-based enhancement/upload), `GITHUB_TOKEN` (higher-rate GitHub scraping), standard proxy creds if needed; CLI flags also cover async/parallel, skip-scrape, checkpoint resume, description/name overrides, OCR/tables/password for PDFs.
- Users describe targets via JSON config: source type(s), crawling selectors/patterns, categories, rate limits, merge mode, router/split strategies, output naming, enhancement toggles.

## Observations for MOVA integration (draft)
- Data candidates (`ds.*`): source descriptors (docs URLs, GitHub repos, PDF paths, merge rules), scrape outputs (page JSON, categorized references), conflict reports (doc vs code mismatches), enhancement summaries/examples, packaging metadata (skill name, description, presets used), runtime stats (pages counted, workers, async/parallel choices).
- Pipeline steps (`env.*`): estimate discovery → scrape/download (docs/github/pdf) with llms.txt short-circuit → optional resume/skip-scrape cache reuse → merge/unified conflict detection → enhancement (local/API) → package/upload; optional split_config/generate_router for large docs.
- Episodes: each skill build (from config or interactive) with inputs (config, flags, env vars) and outputs (data cache, skill folder, zip, conflicts); include timing, page counts, conflict summary, upload status; MCP-driven runs map cleanly to episodes triggered from Claude Code.

## Open questions / risks
- Async/multi-source edge cases: how conflict_detector handles partial crawls, mixed code languages, or merge rules beyond presets not fully detailed outside code.
- Large-doc router flow: exact heuristics in `split_config.py`/`generate_router.py` and how routing keywords are derived may need deeper reading before automation.
- Enhancement quality knobs: API vs local enhancement behaviors (prompting, fallbacks) are documented qualitatively; quantitative impact or limits not specified.
- PDF pipeline breadth: advanced features (OCR/tables/password/parallel) exist, but operational constraints (performance ceilings, required external binaries like tesseract) need confirmation per environment.
- MCP configuration reliability: assumes Claude Code path wiring; placeholder handling and Windows-specific nuances may need validation when integrating with MOVA agents.
