# skill.skill_ingest_store_episode_basic

Хранение эпизодов Skill Seeker:
- вход: `env.skill_ingest_run_store_episode_v1` (внутри `ds.episode_skill_ingest_run_v1`);
- действие: пишет эпизод в файловое хранилище лаборатории (`lab/episodes/skill_ingest/`);
- выход: подтверждение `{ ok, episode_id, path }`.

Используется совместно со `skill.skill_ingest_run_with_skillseeker_basic`.
