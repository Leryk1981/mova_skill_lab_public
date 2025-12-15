# skill.mova_ai_bootstrap_generate_basic (чернетка)

Призначення: швидко зібрати MOVA AI bootstrap-пакет для конкретної моделі/середовища без зовнішніх LLM. Використовує статичний ресурс з описом MOVA 4.0.0, правилами, рецептами та прикладами.

- Вхід: `env.mova_ai_bootstrap_generate_v1` (опис target: model_family, channel, role тощо).
- Вихід: `ds.mova_ai_bootstrap_pack_v1` (JSON з summary, поясненням шарів, правилами JSON, рецептами й прикладами).
- Виклики: немає HTTP/LLM; усе зі статичних ресурсів.

CLI-приклад:
```bash
node skills/skill_mova_ai_bootstrap_generate_basic/impl/code/generate_bootstrap.js \
  --envelope path/to/env.json \
  --output path/to/pack.json
```

Артефакти:
- `pack.json` з `pack_id`, `target`, `created_at`, `instructions`, `workflow_recipes`, `constraints`, `examples`.

Як використовувати:
- Передайте `pack.json` у цільову модель (ChatGPT, Claude Code, Gemini, локальний агент) як стартовий контекст: коротке резюме MOVA, правила для JSON і заборони на вигадування нових вербів/полів.
- Можна генерувати різні пакети для різних каналів (chat / ide_agent / cli) — через `target` у envelope.
