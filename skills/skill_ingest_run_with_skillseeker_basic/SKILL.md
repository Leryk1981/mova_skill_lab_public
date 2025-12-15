# skill.skill_ingest_run_with_skillseeker_basic

Базовый запуск Skill Seeker через CLI:
- вход: `env.skill_ingest_run_request_v1` (inline configs для source/run);
- действие: собирает временный конфиг, вызывает `skill-seekers <mode> --config <temp>` с нужными флагами;
- выход: `ds.skill_ingest_run_result_v1` (статус + пути вывода, без детального парсинга).

Эпизоды не пишет; для записи используйте `skill.skill_ingest_store_episode_basic`.
