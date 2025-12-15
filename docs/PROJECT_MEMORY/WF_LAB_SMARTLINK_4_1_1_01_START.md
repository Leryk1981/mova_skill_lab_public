# WF_LAB_SMARTLINK_4_1_1_01_START

Стартовий епізод серії SmartLink під MOVA 4.1.1. Репозиторій працює на гілці `feature/lab-workflow-experiments-v1`. Skills Lab залишається на червоному ядрі MOVA 4.0.0 (`core/mova/`), а новий spec-снапшот MOVA 4.1.1 підключений як read-only референс (`spec/mova-spec-4.1.1/`).

## Що зроблено
- Перевірено активну гілку через `.git/HEAD` (git-команди не запускались) — `feature/lab-workflow-experiments-v1`.
- Переконалися, що структура Skills Lab на місці (`core/`, `lab/`, `skills/`, `docs/`, `spec/`), README в корені відсутній.
- Запущено `npm test` → успішно пройдена валідація усіх схем/маніфестів та юніт-скриптів.
- Оновлено пам’ять: `npm run memory:import` (22 епізоди) + `npm run memory:snapshot` → `lab/memory/SQLITE_MEMORY_SNAPSHOT_20251211_094539.json`.
- Підготовлено запит для `skill.repo_snapshot_basic` (env `env.repo_snapshot_run_v1`) з деревом репозиторію та нотатками про 4.1.1 vs 4.0.0: `lab/skill_runs/repo_snapshot_WF_LAB_SMARTLINK_4_1_1_01_request.json`.
- Створено project snapshot для цієї точки входу серії: `docs/PROJECT_MEMORY/PROJECT_SNAPSHOT_2025-12-11_smartlink_4_1_1_lab_entry.md` (містить і блок global memory).

## Посилання
- Project snapshot: `docs/PROJECT_MEMORY/PROJECT_SNAPSHOT_2025-12-11_smartlink_4_1_1_lab_entry.md`.
- Запит/результат repo snapshot: `lab/skill_runs/repo_snapshot_WF_LAB_SMARTLINK_4_1_1_01_request.json`, `lab/skill_runs/repo_snapshot_WF_LAB_SMARTLINK_4_1_1_01_result.json`.
- MOVA 4.1.1 spec (read-only): `spec/mova-spec-4.1.1/`.
- Оновлена пам’ять SQLite: `lab/memory/SQLITE_MEMORY_SNAPSHOT_20251211_094539.json`.

## Next (checklist)
- Підготувати `docs/lab_workflow_smartlink_4_1_1_context.md` з мостом між попередньою серією WF_LAB_08 і новою 4.1.1.
- Налаштувати domain experiment WF_EX_010 (baseline vs SmartLink-4.1.1).
- Продовжити покращення SmartLink до стану “best-so-far 4.1.1”.
