# skill.file_cleanup_snapshot_node_basic

Базовий snapshot-skill для file_cleanup.
- Вхід: `env.file_cleanup_snapshot_request_v1`
- Вихід: `ds.file_cleanup_snapshot_v1`
- Дія: рекурсивне сканування `target.root_path`, збір метаданих файлів/каталогів і stats. Жодних видалень чи змін файлів.
