# skill.file_cleanup_plan_node_basic

Базовий планувальник file_cleanup (без видалень).
- Вхід: `env.file_cleanup_plan_request_v1` (snapshot + preferences).
- Вихід: `ds.file_cleanup_plan_v1` (action per file: keep/delete/archive/ask, з reason і summary).
- Логіка: читає snapshot, застосовує прості правила (Downloads installers/archives, Desktop старі файли, великі старі відео → archive/delete, documents keep, інше ask), формує план. Нічого не змінює у файловій системі.
