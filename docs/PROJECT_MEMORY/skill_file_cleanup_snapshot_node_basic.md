# skill.file_cleanup_snapshot_node_basic (phase 1)

Призначення: безпечно зібрати snapshot файлової системи для сценарію file_cleanup. Нічого не видаляє.

- Вхід: `env.file_cleanup_snapshot_request_v1`
- Вихід: `ds.file_cleanup_snapshot_v1`
- Логіка: рекурсивно сканує `target.root_path`, фільтрує за `exclude_patterns`, збирає метадані (kind, size, mtime/atime, extension) та stats. Жодних side-effects.

CLI-приклад:
```bash
node skills/skill_file_cleanup_snapshot_node_basic/impl/code/run_snapshot.js \
  --envelope lab/examples/env.file_cleanup_snapshot_request_v1.local_downloads.json \
  --output lab/examples/ds.file_cleanup_snapshot_v1.local_downloads.json
```

Фаза: 1 (тільки snapshot). Планування/видалення будуть окремими skills.
