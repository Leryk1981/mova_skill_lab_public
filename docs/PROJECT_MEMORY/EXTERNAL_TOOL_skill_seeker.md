# EXTERNAL TOOL — Skill Seeker

## Що це
Skill Seeker — зовнішній Python-CLI, що збирає знання з документаційних сайтів, GitHub-репозиторіїв і PDF у структурований Claude-skill: сторінки JSON, посилання в references/, згенерований SKILL.md і zip-пакет, готовий до завантаження в Claude.

## Як інтегровано в MOVA Skills Lab
- Червоні схеми: `ds.skill_ingest_source_config_v1`, `ds.skill_ingest_run_config_v1`, `ds.skill_ingest_run_result_v1`, `ds.episode_skill_ingest_run_v1`.
- Конверти: `env.skill_ingest_run_request_v1`, `env.skill_ingest_run_store_episode_v1`.
- Жовті skills: `skill.skill_ingest_run_with_skillseeker_basic`, `skill.skill_ingest_store_episode_basic`.
- Детальний меппінг: `docs/PROJECT_MEMORY/skill_seeker_mova_mapping.md`.
- Звіт першого прогону: `docs/PROJECT_MEMORY/skill_seeker_first_run_fastapi_unified_test.md`.

## Як підключити зовнішній репозиторій знову
- Клонувати поруч із `mova_skills_lab`, наприклад: `skill_seekers_development/skill-seeker` (git URL: https://github.com/yusufkaraaslan/Skill_Seekers.git).
- У корені клонованого репо:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate  # або .venv\Scripts\activate у Windows
  pip install -e .
  skill-seekers --help
  ```
- Інтеграційний запуск із `mova_skills_lab`:
  ```bash
  source ../skill_seekers_development/skill-seeker/.venv/bin/activate  # або відповідний шлях у Windows
  cd path/to/mova_skills_lab
  node skills/skill_ingest_run_with_skillseeker_basic/impl/code/run_ingest.js \
    --envelope lab/examples/env.skill_ingest_run_request_v1.fastapi_unified_test.json
  ```

Примітка: Skill Seeker не є частиною репозиторію mova_skills_lab; це зовнішній інструмент, який можна повторно підключити при потребі, використовуючи інструкції вище.
