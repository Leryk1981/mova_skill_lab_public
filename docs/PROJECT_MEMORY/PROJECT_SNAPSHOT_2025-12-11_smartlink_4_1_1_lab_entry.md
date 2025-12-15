# SmartLink 4.1.1 — стартовий project snapshot (2025-12-11)

## Контекст і версії
- Гілка репозиторію: `feature/lab-workflow-experiments-v1` (перевірено через `.git/HEAD`, git-команди не запускались).
- Вкладений Skills Lab залишається на MOVA **4.0.0** у `core/mova/`.
- Снапшот специфікації MOVA **4.1.1** лежить у `spec/mova-spec-4.1.1/` (read-only референс для лабораторії).
- Структура Skills Lab на місці: `core/`, `lab/`, `skills/`, `docs/`, `spec/`, `envelopes/`, `schemas/`.
- README в корені відсутній; основна документація — у `docs/`.

## Що зроблено в цьому запуску
- Запущено `npm test` (через `package.json` у корені Skills Lab) — валідація схем/маніфестів і всі наявні тестові ранери пройшли успішно.
- Оновлено SQLite-пам’ять: `npm run memory:import` (22 епізоди) + `npm run memory:import:decisions` (джерел немає) + `npm run memory:snapshot` → новий дамп `lab/memory/SQLITE_MEMORY_SNAPSHOT_20251211_094539.json`.
- Підготовлено запит для `skill.repo_snapshot_basic` через `env.repo_snapshot_run_v1`: `lab/skill_runs/repo_snapshot_WF_LAB_SMARTLINK_4_1_1_01_request.json` (дерево репозиторію без `node_modules`/`.git`, нотатки про MOVA 4.1.1 у `spec/` і ядро 4.0.0).
- Згенеровано цей project snapshot та стиснутий блок global memory (мовою `uk`) як стартову точку серії SmartLink 4.1.1.

## Огляд структури (коротко)
- `core/mova/`: MOVA 4.0.0 (ds.*, env.*, глобальні словники, specs/4.0.0).
- `spec/mova-spec-4.1.1/`: read-only снапшот MOVA 4.1.1 (security layer, operator frame, text channels, catalogs, release notes).
- `skills/`: інфраструктурні скіли (`repo_snapshot_basic`, `repo_code_change_plan_basic`, `code_exec_task_basic`, scaffolder-и), MCP-конектор `context7_docs`, meta-оператор, bootstrap та cleanup скіли; епізоди для попередніх WF_LAB/WF_EX.
- `lab/`: `skills_registry_v1.json`, приклади/envelopes для експериментів, skill_runs історичні запити/результати, `experiments/smartlink_*` (baseline і codex-кандидат), згенеровані bootstrap-підказки.
- `docs/`: основні маніфести MOVA/Skills Lab, попередні PROJECT_SNAPSHOTи, PROJECT_MEMORY та прогрес WF_LAB/WF_EX; `IDE_AGENT_PROTOCOL_v1.md` описує роботу агента.

## Посилання
- Запит на снапшот: `lab/skill_runs/repo_snapshot_WF_LAB_SMARTLINK_4_1_1_01_request.json`.
- Новий memory dump: `lab/memory/SQLITE_MEMORY_SNAPSHOT_20251211_094539.json`.
- Снапшот MOVA 4.1.1 (read-only): `spec/mova-spec-4.1.1/`.

## Global memory (коротко, для чат-сесій)
- SmartLink серія 4.1.1 стартує в Skills Lab на гілці `feature/lab-workflow-experiments-v1`; ядро `core/mova/` лишається на MOVA 4.0.0.
- Read-only снапшот MOVA 4.1.1 розміщено у `spec/mova-spec-4.1.1/` (security layer, operator frame, text channels, catalogs).
- Валідація та тести (`npm test`) успішні; SQLite-пам’ять оновлено (`npm run memory:import`, `npm run memory:snapshot` → `lab/memory/SQLITE_MEMORY_SNAPSHOT_20251211_094539.json`).
- Репо-запит для `skill.repo_snapshot_basic` зібрано у `lab/skill_runs/repo_snapshot_WF_LAB_SMARTLINK_4_1_1_01_request.json` із деревом без `node_modules`/`.git`.
- Вхідна документація у `docs/` (конституція, маніфест, протокол агента); попередні PROJECT_SNAPSHOTи — у `docs/PROJECT_MEMORY/`.
