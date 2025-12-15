# Skill Seeker → MOVA mapping (чернетка)

## 1. Базовий патерн

Skill Seeker реалізує один основний конвеєр:

> опис джерел → запуск джоб на їх обробку → побудова Claude-skill пакета → статистика + конфлікти.

У термінах MOVA це:

- дані про джерела та режими запуску → кандидати в `ds.*`;
- сам запуск конвеєра → `env.*` (мовний акт);
- факт виконання з метриками → `episode.*` (епізод генетичного шару).

---

## 2. Data Schemas (ds.*)

### 2.1. `ds.skill_ingest_source_config_v1`

**Призначення:** описує, *звідки* Skill Seeker збирає матеріал для побудови skills.

Ключові поля (чернетка):

- `config_id`: рядок, ідентифікатор конфігурації.
- `name`: коротке ім’я джобу / skill-пакета.
- `description`: людський опис призначення ingest’у.
- `sources[]`:
  - `kind`: `"docs" | "github" | "pdf" | "unified"`.
  - `url`: базовий URL для документації / API-docs.
  - `repo`: `"owner/name"` для GitHub.
  - `pdf_path`: шлях або URI до PDF.
  - `include_patterns[]` / `exclude_patterns[]`: селектори файлів/шляхів.
  - `max_pages`, `crawl_depth`, `rate_limits`: обмеження збору.
- `categories[]`: логічні категорії посилань / тем.
- `router_strategy`: правила, коли/як розбивати джерела на під-skills.
- `merge_strategy`: як об’єднувати docs + github + pdf у єдину базу.

---

### 2.2. `ds.skill_ingest_run_config_v1`

**Призначення:** описує, *як саме* запускати конвеєр (режим, async, enhance, вихідні імена).

Ключові поля:

- `run_id`: ідентифікатор запуску.
- `source_config_ref`: посилання на `ds.skill_ingest_source_config_v1` (за `config_id` або іншим ключем).
- `mode`: `"estimate" | "scrape" | "scrape+enhance" | "scrape+package" | "full"`.
- `execution_flags`:
  - `async_enabled`: булеве.
  - `workers`: кількість воркерів.
  - `skip_scrape`: булеве.
  - `resume_checkpoint`: булеве.
- `enhancement`:
  - `enhance_local`: булеве.
  - `enhance_via_api`: булеве.
  - `api_provider`: наприклад, `"anthropic"`.
- `output_naming`:
  - `output_name`: логічне ім’я набору (`<name>` в `output/<name>`).
  - `output_dir`: базовий каталог для output.
- `env_requirements`:
  - `needs_ANTHROPIC_API_KEY`: булеве.
  - `needs_GITHUB_TOKEN`: булеве.

---

### 2.3. `ds.skill_ingest_run_result_v1`

**Призначення:** результат одного запуску Skill Seeker з основними метриками та шляхами.

Ключові поля:

- `run_id`: той самий, що в `run_config`.
- `status`: `"success" | "partial" | "failed"`.
- `timing`:
  - `started_at`, `finished_at`.
  - `duration_ms`.
- `pages_stats`:
  - `pages_discovered`.
  - `pages_scraped`.
  - `pages_skipped`.
  - `llms_txt_shortcut_used`: булеве.
- `output_locations`:
  - `data_dir`: шлях до сирих даних (`*_data`).
  - `skill_dir`: шлях до готового skill-каталогу.
  - `zip_path`: шлях до zip-пакета.
- `skill_metadata`:
  - `skill_name`.
  - `skill_description`.
  - `categories[]`.
- `conflicts_summary`:
  - `total_conflicts`.
  - `by_severity`: об’єкт з `info/warn/error`.
  - `sample_conflicts[]`: перші N записів (ідентифікатор / короткий опис).
- `upload_status`:
  - `uploaded`: булеве.
  - `target`: наприклад `"claude_library"`.
  - `upload_error`: текст помилки, якщо була.

---

## 3. Episode-schema

### 3.1. `ds.episode_skill_ingest_run_v1` (назва умовна)

**Призначення:** один епізод генетичного шару для запуску Skill Seeker.

Містить:

- `episode_id`.
- `envelope_id`: ідентифікатор мовного акту, який ініціював запуск.
- `source_config`: вбудований або посилання на `ds.skill_ingest_source_config_v1`.
- `run_config`: вбудований або посилання на `ds.skill_ingest_run_config_v1`.
- `run_result`: вбудований `ds.skill_ingest_run_result_v1`.
- `metrics`:
  - `success`: булеве.
  - `conflicts_per_100_pages`: число.
  - `upload_success`: булеве.
- `context`:
  - `project_id` / `repo`.
  - `tool_version`: версія Skill Seeker.
  - `executor`: де виконувався запуск (локально, CI, IDE-агент).
- `notes`: довільний текст/коментар (може заповнюватися людиною або ІІ-агентом).

---

## 4. Envelopes (env.*) та жовті skills

### 4.1. `env.skill_ingest_run_request_v1`

**Призначення:** мовний акт «запусти ingest Skill Seeker за цим описом».

Вхідні поля:

- `skill_ingest_source_config`: об’єкт `ds.skill_ingest_source_config_v1` або посилання.
- `skill_ingest_run_config`: об’єкт `ds.skill_ingest_run_config_v1`.
- `requested_by`: ідентифікатор ініціатора (людина / інший агент / сценарій).
- `priority`: опційно.

Очікуваний результат: об’єкт `ds.skill_ingest_run_result_v1` або помилка.

---

### 4.2. `env.skill_ingest_run_store_episode_v1`

**Призначення:** мовний акт «запиши результат запуску як епізод у генетичне сховище».

Вхід:

- `episode`: об’єкт `ds.episode_skill_ingest_run_v1`.

Результат: підтвердження запису (ід, шлях, тощо).

---

### 4.3. Жовті skills (чернетка)

1. `skill.skill_ingest_run_with_skillseeker_basic`  
   - Вхід: `env.skill_ingest_run_request_v1`.  
   - Дії:
     - перетворює `ds.skill_ingest_source_config_v1` + `ds.skill_ingest_run_config_v1` у тимчасову конфігурацію Skill Seeker;
     - збирає CLI-команду для Skill Seeker;
     - виконує її через існуючий механізм виконання коду;
     - будує `ds.skill_ingest_run_result_v1` з файлів output.
   - Вихід: `ds.skill_ingest_run_result_v1`.

2. `skill.skill_ingest_store_episode_basic`  
   - Вхід: `env.skill_ingest_run_store_episode_v1`.  
   - Дії: зберігає `ds.episode_skill_ingest_run_v1` у genetic-storage Skills Lab (наприклад, JSON-файл у `lab/episodes/`).  
   - Вихід: підтвердження запису.

> Наступний крок (поза цим файлом) — описати JSON Schema для:
> - `ds.skill_ingest_source_config_v1`,
> - `ds.skill_ingest_run_config_v1`,
> - `ds.skill_ingest_run_result_v1`,
> - `ds.episode_skill_ingest_run_v1`.
