# MOVA Skills Lab — Project Snapshot (2025-12-05)

## 1. Repository overview
MOVA Skills Lab — контракти й скіли для MOVA 4.0.0 (червоні схеми/envelope/епізоди, жовті skills, зелений шар експериментів). Підхід contract-first: усе описано через JSON Schema, маніфести та registry, виконання робиться зовнішніми рантаймами/агентами.

## 2. Structure (short)
```
mova_skills_lab/
├── core/mova/                 # Червоний шар: глобальні словники + ds/env/episodes/specs
├── skills/                    # Жовтий шар: skills (manifests, bindings, prompts/code/tests)
├── lab/                       # Зелений шар: registry, приклади run/envelope, cases
├── docs/                      # Документація (конституція MOVA, огляди, snapshots, memory)
├── tools/                     # Валідація/утиліти (validate_lab.js, run_skill_plan.js, record_episode.js)
├── package.json               # Скрипти валідації/тестів
└── .gitignore                 # Ігнори (node_modules, tmp, skill_seekers_development, тощо)
```

## 3. Red layer (core/mova)
- Глобальні словники: roles/resources/states/verbs.
- Ключові ds: `ds.episode_v1`, `ds.skill_descriptor_v1`, `ds.skill_registry_v1`, `ds.skill_run_request_v1`, `ds.skill_runtime_binding_v1`, `ds.call_request_v1`, `ds.call_result_v1`, `ds.episode_policy_v1` + нові Skill Seeker ingest (`ds.skill_ingest_*`, `ds.episode_skill_ingest_run_v1`) і bootstrap таргети/пакети.
- Envelopes: `env.skill_run_v1`, `env.call_run_v1`, `env.skill_ingest_run_request_v1`, `env.skill_ingest_run_store_episode_v1` (MOVA-call & Skill Seeker інтеграція).
- Specs: канонічна MOVA 4.0.0 спека — https://github.com/Leryk1981/mova-4.0.0 (локальний дубль прибрано).

## 4. Yellow layer (skills/)
- Інфраструктурні: `skill.repo_snapshot_basic`, `skill.skill_scaffolder_basic`, `skill.connector_scaffolder_basic`, `skill.runtime_binding_code_scaffolder_basic`, `skill.code_exec_task_basic`, `skill.repo_code_change_plan_basic`, `skill.mova_template`.
- Конектори/мета: `skill.context7_docs`, `skill.mova_lab_operator`.
- Skill Seeker інтеграція: `skill.skill_ingest_run_with_skillseeker_basic` (запуск Skill Seeker), `skill.skill_ingest_store_episode_basic` (запис епізоду).
- Архівні/експериментальні: `skill.file_cleanup_basic`.

## 5. Green layer (lab/)
- `skills_registry_v1.json` — реєстр усіх skills + bindings.
- `examples/` (нове) — приклади envelope для інтеграцій.
- Тести/кейси/епізоди розкладені всередині skills/.

## 6. Tooling & tests
- Валідація: `npm run validate` (Ajv draft-2020-12).
- Повний тестовий прогін: `npm test` (валідація + unit-тести skill_ingest_*; буде доповнений новими скілами).
- Утиліти: `run_skill_plan.js`, `record_episode.js`, `validate_lab.js`.

## 7. Recent changes (2025-12-05)
- Інтеграція Skill Seeker: додані ds/env схеми, два skills (run/store), приклад envelope, перший реальний прогін fastapi_unified_test, видалено локальний клон Skill Seeker з репо, додано .gitignore для нього, оформлена пам’ять у PROJECT_MEMORY.
- Підготовка до MOVA AI bootstrap skill: заплановані нові ds/env та жовтий skill для генерації bootstrap-пакету без виклику зовнішніх моделей.
