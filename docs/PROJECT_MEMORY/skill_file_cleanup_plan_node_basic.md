# skill.file_cleanup_plan_node_basic (phase 2 plan)

Призначення: сформувати план прибирання файлів на основі snapshot. Нічого не видаляє і не змінює.

- Вхід: `env.file_cleanup_plan_request_v1` (містить `ds.file_cleanup_snapshot_v1` + preferences).
- Вихід: `ds.file_cleanup_plan_v1` (action: keep/delete/archive/ask з reason та summary).
- Основні правила:
  - Systemish шляхи — завжди keep.
  - Downloads: старі інсталятори → delete; старі архіви → archive.
  - Desktop: старі елементи (>30 днів) → archive.
  - Великі старі відео (size >= min_size_archive_bytes, age >= max_age_days_for_temp) → archive.
  - Документи в Documents/проектній зоні → keep за замовчуванням.
  - Інше → ask.
- Жодних side-effects: лише JSON-план.

CLI-приклад:
```bash
node skills/skill_file_cleanup_plan_node_basic/impl/code/run_plan.js \
  --envelope lab/examples/env.file_cleanup_plan_request_v1.local_downloads.json \
  --output lab/examples/ds.file_cleanup_plan_v1.local_downloads.plan.json
```
