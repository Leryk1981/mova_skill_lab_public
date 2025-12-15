# MOVA Skills Lab — Project Snapshot (2025-12-03)

## 1. Загальна структура репозиторію

MOVA Skills Lab — це монорепозиторій для дослідження та організації "навиків" (skills) для LLM через фреймворк MOVA 4.0.0. Репозиторій структурований за принципом трьох шарів: червоний (ядро MOVA), жовтий (скіли), зелений (експерименти та виконання).

**Структура директорій:**

```
mova_skills_lab/
├── docs/                    # Документація для людей
├── core/                    # Червоний шар — ядро MOVA
│   └── mova/
│       ├── 00_MANIFEST.json
│       ├── global/          # Глобальний словник (roles, resources, states, verbs)
│       ├── ds/              # Data schemas (ds.*)
│       ├── env/             # Envelopes (env.*)
│       ├── episodes/        # Епізоди та генетичний шар
│       └── specs/           # Офіційні MOVA 4.0.0 специфікації
├── skills/                   # Жовтий шар — навики
│   ├── mova_template/       # Еталон структури навика
│   ├── context7_docs/        # Навик для Context7 MCP
│   └── mova_lab_operator/   # Meta-навик для IDE агентів
├── lab/                     # Зелений шар — експерименти
│   ├── skills_registry_v1.json
│   └── skill_runs/          # Приклади запитів на запуск
├── tools/                   # Інструменти валідації та планування
├── package.json
└── .gitignore
```

## 2. Червоне ядро (`core/mova`)

Червоне ядро містить спільні контракти MOVA 4.0.0, які використовуються всіма навиками в лабораторії. Воно не містить виконуваного коду, тільки описи даних, дій та конвертів.

### 2.1. Маніфест ядра

- **`00_MANIFEST.json`** — фіксує версію MOVA core (`4.0.0-core-draft-1`), посилання на офіційний каталог схеми та конверт публікації каталогу.

### 2.2. Глобальний словник (`global/`)

- **`roles.json`** — ролі: `human`, `agent`, `tool`, `worker`, `registry`.
- **`resources.json`** — ресурси: `skill`, `procedure`, `episode`, `envelope`, `catalog`, `file`, `note`.
- **`states.json`** — стани життєвого циклу: `draft`, `planned`, `running`, `succeeded`, `failed`, `cancelled`, `archived`.
- **`verbs.json`** — дієслова: `create`, `update`, `publish`, `record`, `route`, `transform`, `scan`, `run`.

### 2.3. Data schemas (`ds/`)

- **`ds.episode_v1.schema.json`** — спільний формат епізодів виконання для генетичного шару. Всі епізоди в лабораторії мають відповідати цій схемі.

- **`ds.skill_descriptor_v1.schema.json`** — схема опису навика. Кожен `manifest.skill.json` є екземпляром цієї схеми.

- **`ds.skill_registry_v1.schema.json`** — схема реєстру навиків. Описує структуру `lab/skills_registry_v1.json`.

- **`ds.skill_runtime_binding_v1.schema.json`** — схема прив'язки навика до рантайму (MCP, local script, Cloudflare Worker тощо).

- **`ds.episode_policy_v1.schema.json`** — політика запису епізодів (`none`, `on_error`, `sampled`, `full`).

- **`ds.skill_run_request_v1.schema.json`** — контрольний запит на запуск навика через control plane.

### 2.4. Envelopes (`env/`)

- **`env.skill_run_v1.schema.json`** — control-plane конверт для запуску навиків. Має `verb = "run"`, `resource = "skill"`, `input` посилається на `ds.skill_run_request_v1`.

### 2.5. Специфікації (`specs/`)

- **`specs/schemas/`** — офіційні схеми MOVA 4.0.0:
  - `ds.mova4_core_catalog_v1.schema.json`
  - `env.mova4_core_catalog_publish_v1.schema.json`
- **`specs/examples/`** — приклади використання офіційних схем.

**Роль ядра:** Червоний шар визначає спільні контракти для всіх навиків, забезпечуючи консистентність та можливість взаємодії між навиками через стандартизовані формати даних та конвертів.

## 3. Жовтий шар — скіли (`skills/`)

### 3.1 `skill.mova_template`

**Шлях:** `skills/mova_template/`

**Призначення:** Канонічний приклад структури MOVA-навика. Перетворює текстовий опис процедури на структурований список кроків. Служить еталоном для створення інших навиків.

**Що є:**

- **`manifest.skill.json`** — описує навик як екземпляр `ds.skill_descriptor_v1`, використовує `ds.episode_v1` та локальні `ds.mova_template_procedure_v1`, `env.mova_template_run_v1`. Політика епізодів: `mode = "none"`.

- **`mova/ds/ds.mova_template_procedure_v1.schema.json`** — схема структурованої процедури з кроками.

- **`mova/env/env.mova_template_run_v1.schema.json`** — конверт для запуску навика з `verb = "transform"`.

- **`cases/mova_template_coffee_example.json`** — приклад кейсу: вхід (опис приготування кави) та очікуваний вихід (структурована процедура).

- **`episodes/2025-12-03T10-00-00Z_episode_0001.json`** — реальний епізод виконання, валідний проти `ds.episode_v1`.

- **`impl/bindings/mova_template_local_dummy_binding.json`** — прив'язка до `runtime_type = "local_script"` (поки dummy).

### 3.2 `skill.context7_docs`

**Шлях:** `skills/context7_docs/`

**Призначення:** Навик для отримання актуальної документації бібліотек через Context7 MCP сервер. Використовується перед початком роботи з проєктом для збору контексту.

**Що є:**

- **`manifest.skill.json`** — описує навик, використовує локальні `ds.context7_docs_request_v1`, `ds.context7_docs_bundle_v1`, `env.context7_docs_fetch_v1`. Політика епізодів: `mode = "on_error"`.

- **`mova/ds/ds.context7_docs_request_v1.schema.json`** — схема запиту до Context7 (library, topic, question тощо).

- **`mova/ds/ds.context7_docs_bundle_v1.schema.json`** — схема структурованого пакету документації з items (snippets, URLs, версії).

- **`mova/env/env.context7_docs_fetch_v1.schema.json`** — конверт для отримання документації через Context7.

- **`cases/context7_docs_ajv_draft2020_case_01.json`** — приклад кейсу для отримання документації Ajv з підтримкою draft-2020-12.

- **`episodes/2025-12-03T12-00-00Z_episode_0001.json`** — реальний епізод виконання через Context7 MCP.

- **`impl/bindings/context7_mcp_remote_v1.json`** — MCP binding до Context7 сервера (`runtime_type = "mcp"`, `mcp_server = "context7"`, `mcp_tool = "get-library-docs"`).

### 3.3 `skill.mova_lab_operator`

**Шлях:** `skills/mova_lab_operator/`

**Призначення:** Meta-навик для IDE агентів. Описує, як правильно працювати з лабораторією: читати реєстр, планувати запуски, записувати епізоди. **Не виконує доменну роботу** (файли, нотатки), тільки навчає агента користуватися лабораторією.

**Що є:**

- **`manifest.skill.json`** — описує meta-навик, використовує тільки core схеми (`ds.skill_descriptor_v1`, `ds.skill_registry_v1`, `ds.skill_runtime_binding_v1`, `ds.episode_v1`, `ds.episode_policy_v1`, `ds.skill_run_request_v1`, `env.skill_run_v1`). Політика епізодів: `mode = "none"`.

- **`mova/ds/`, `mova/env/`** — поки порожні, навик використовує тільки core схеми.

- **`impl/prompts/agent_profile.md`** — промпт для IDE агентів з інструкціями, як працювати з лабораторією.

- **`cases/`, `episodes/`** — поки порожні, структура готова для майбутніх кейсів.

## 4. Зелений шар — `lab/`

Зелений шар містить експерименти, реєстри та запити на запуск, які не є частиною червоного ядра або жовтих навиків.

- **`lab/skills_registry_v1.json`** — централізований реєстр усіх навиків у лабораторії. Містить список навиків з їх `skill_id`, `manifest_path`, `state` та `bindings[]`. Кожен binding має `binding_id`, `runtime_type` та `binding_path`. Реєстр дозволяє meta-навикам та інструментам швидко знаходити навики без сканування файлової системи.

- **`lab/skill_runs/context7_ajv_run_request_01.json`** — приклад запиту на запуск навика (`ds.skill_run_request_v1`) для `skill.context7_docs` з конкретним `binding_id`. Використовується для тестування планувальника запусків.

**Використання:** `lab/` служить місцем для експериментів, тестових запитів та централізованих реєстрів, які допомагають координувати роботу з навиками без зміни структури самих навиків.

## 5. Інструменти (`tools/`)

- **`tools/validate_lab.js`** — валідатор на Node.js/Ajv (draft-2020-12). Перевіряє: `lab/skills_registry_v1.json` проти `ds.skill_registry_v1`, кожен `manifest.skill.json` проти `ds.skill_descriptor_v1`, кожен runtime binding проти `ds.skill_runtime_binding_v1`, кожен епізод проти `ds.episode_v1`. Запускається через `npm run validate`.

- **`tools/record_episode.js`** — створює епізод (`ds.episode_v1`) з кейсу. Читає case файл з `envelope` та `expected_output`, формує епізод з правильними полями та зберігає в `skills/<name>/episodes/`. Підтримує опціональні параметри: `--status`, `--actor-role`, `--actor-id`.

- **`tools/run_skill_plan.js`** — планувальник запуску навиків. Читає `ds.skill_run_request_v1`, шукає навик у реєстрі, завантажує маніфест та `episode_policy`, вибирає binding (за `binding_id` або автоматично), визначає effective episode recording mode та виводить JSON план. **Не виконує** навик, тільки планує.

## 6. Документація (`docs/`)

- **`01_MOVA_CONSTITUTION.md`** — описує, що таке MOVA 4.0.0 в контексті лабораторії: schemas, envelopes, global vocabulary, episodes.

- **`02_LAYERS_RED_YELLOW_GREEN.md`** — пояснює тришарову архітектуру: червоний (ядро), жовтий (скіли), зелений (виконання).

- **`03_GLOBAL_VOCABULARY.md`** — описує глобальний словник: roles, resources, states, verbs з конкретними значеннями.

- **`04_ENVELOPE_SPEC.md`** — як визначаються конверти (`env.*`), включаючи control-plane конверт `env.skill_run_v1`.

- **`05_SCHEMA_SPEC.md`** — як визначаються схеми (`ds.*`) та їх зв'язок з MOVA 4.0.0 core catalog.

- **`06_EPISODES_GENETIC_LAYER.md`** — як працюють епізоди та генетичний шар, включаючи політики епізодів (`episode_policy`).

- **`07_RUNTIME_AND_ADAPTERS.md`** — шар виконання та адаптерів: де живуть рантайми, як обробляються секрети, профіль MCP runtime.

- **`08_CONTEXT7_MCP_PROFILE.md`** — профіль Context7 MCP сервера: варіанти використання (remote HTTP, local npm), API ключі, зв'язок з `skill.context7_docs`.

- **`09_IDE_AGENT_PROFILE.md`** — профіль для IDE агентів: як знаходити навики, планувати запуски, виконувати навики (поза репо), записувати епізоди, guardrails.

- **`10_SKILLS_OVERVIEW.md`** — огляд усіх навиків у лабораторії, схема дескриптора навика, реєстр навиків.

## 7. Поточний стан і наступні кроки

**Що вже реалізовано:**

- Повна структура червоного ядра з глобальним словником, схемами навиків, реєстру, прив'язок, епізодів, політик епізодів та control-plane контрактами (`ds.skill_run_request_v1`, `env.skill_run_v1`).

- Три навики: `skill.mova_template` (еталон), `skill.context7_docs` (реальний MCP-навик), `skill.mova_lab_operator` (meta-навик для IDE агентів).

- Централізований реєстр навиків (`lab/skills_registry_v1.json`), який знає про всі навики та їх прив'язки.

- Інструменти для валідації, створення епізодів та планування запусків.

- Профіль IDE агента, який описує, як працювати з лабораторією.

**Принцип, який закріплено:**

Skills Lab = опис навиків + контрольна площина + генетичний шар. Виконання завжди живе зовні (IDE, MCP, Cloudflare тощо). Репозиторій не містить виконуваного коду рантаймів, тільки контракти та описи.

**Можливі наступні кроки:**

- Створення простого доменного навика (наприклад, `skill.file_cleanup` для інвентаризації файлів).

- Глибша інтеграція з IDE: автоматичне планування запусків на основі контексту проєкту.

- Реалізація реального виконання через MCP або локальні скрипти на основі планів від `run_skill_plan.js`.

- Розширення генетичного шару: аналітика епізодів, виявлення патернів у виконанні навиків.

- Додавання нових типів рантаймів (Cloudflare Workers, Claude Skills, Gemini Agents) з відповідними bindings.

