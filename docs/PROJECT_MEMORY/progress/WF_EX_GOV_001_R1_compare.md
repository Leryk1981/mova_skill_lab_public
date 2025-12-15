# WF-EX-GOV-001-R1-COMPARE

## Runs

### qwen
- Command: `node lab/experiments/WF_EX_GOV_001/attempts/qwen/runner/validate_examples.mjs`
- Result: PASS
- Time: ~0.21s (Measure-Command)
- Notes/output:
  - Skipped core schema dirs due to wrong relative path (`lab/experiments/core/...`).
  - Loaded 7 schemas (compat+pack only).
  - Custom validator reports all 4 examples valid.

### codex_cli
- Command: `node lab/experiments/WF_EX_GOV_001/attempts/codex_cli/runner/validate_examples.mjs`
- Result: PASS
- Time: ~0.79s
- Notes/output:
  - `[schema_loader] Loaded 8 schemas from core/compat/pack.`
  - `[validate_examples] PASS – all governance examples are valid.`

### codex_ide
- Command: `node lab/experiments/WF_EX_GOV_001/attempts/codex_ide/runner/validate_examples.mjs`
- Result: PASS
- Time: ~0.73s
- Notes/output:
  - `PASS: 4 examples validated`

## Delta підходу

### Compat-схеми
- qwen: 2 файли.
  - `ds.mova_schema_core_v1.schema.json`
  - `ds.security_event_episode_core_v1.schema.json`
- codex_cli: 3 файли.
  - `ds.mova_schema_core_v1.schema.json`
  - `ds.mova_episode_core_v1.schema.json`
  - `ds.security_event_episode_core_v1.schema.json`
- codex_ide: 3 файли (ті ж, що codex_cli) але **без редагування**.

### Послаблення / shim-magic
- qwen:
  - Compat `ds.security_event_episode_core_v1` — спрощений, не відповідає spec (немає allOf/enum/повних required).
  - Валідація **не через Ajv**, а кастомний recursive-checker з частковою підтримкою keywords.
  - Core фактично не завантажується (помилка шляхів), тому колізії/спільні контракти не перевіряються.
- codex_cli:
  - Ajv2020 `strict:false`.
  - Compat `ds.mova_episode_core_v1` і `ds.security_event_episode_core_v1` **послаблені required**; додано alias `category`.
  - Це дозволяє прикладам проходити без доповнення полів епізоду.
- codex_ide:
  - Ajv2020 `strict:false` (як у лабораторії).
  - Compat схеми **1:1 з spec** (ніяких послаблень/alias).
  - Приклад `governance_episode_store.example.json` доповнений до вимог spec (mova_version/recorded_at/executor/result_*).

### Маппінг example → schema
- qwen: fuzzy:
  - спершу `envelope_id`/`schema_id`, інакше — ім’я файлу → `$id`.
  - при відсутності schema — просто фіксує помилку (але в цьому наборі все знайшлось).
- codex_cli: fuzzy по basename:
  - шукає точний `${basename}.schema.json`, інакше — `includes(basename)` у pack/schemas.
- codex_ide: явний/контрактний:
  - `envelope_id` → `https://mova.dev/schemas/<envelope_id>.schema.json`
  - `schema_id` → `https://mova.dev/schemas/<schema_id>.schema.json`
  - без fallback по імені файлу.

## Winner

**codex_ide**.

Причини:
- Overlay-only і мінімальний compat (3 реальних залежності, без дублювань).
- Нуль shim‑магії в compat: схеми з spec без змін.
- Прозора підтримка `$id/$ref` через Ajv та явне мапування example→schema.
- Відтворюваність: одна команда, детермінований loader, коректне завантаження core+compat+pack.

Коли допустимий codex_cli:
- Якщо принципово не хочемо чіпати приклади і погоджуємось на тимчасові послаблення required/alias у compat.

qwen — як контрольний “quick smoke”, але не як baseline інтеграція (немає Ajv, core не підтягується, compat надто спрощений).

