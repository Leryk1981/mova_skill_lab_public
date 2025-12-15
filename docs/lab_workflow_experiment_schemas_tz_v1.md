# ТЗ: Схеми та конверти для лабораторії воркфлоу

**Мета:** визначити мінімальний набір JSON-схем (ds.*) і конвертів (env.*) для підтримки експериментів з воркфлоу в MOVA Skills Lab.

---

## 1. Загальні принципи

- Усі схеми мають бути **lab-рівня** (зелений шар) і не змінювати ядро MOVA.  
- Імена схем: `ds.lab_workflow_*_v1`.  
- Імена конвертів: `env.lab_workflow_*_request_v1`.  
- Схеми мають бути сумісні з поточним ядром MOVA 4.0.0 (версія в core/mova).  
- Схеми пишемо англійською (canonical), коментарі/документація — можна українською.

---

## 2. Схема: ds.lab_workflow_procedure_v1

**Призначення:** опис конкретного воркфлоу (процедури) з кроками.

Мінімальні поля:

- `procedure_id: string` — унікальний ідентифікатор;
- `title: string` — коротка назва;
- `description: string` — опис у вільній формі;
- `domain: string` — домен (наприклад, `repo_change_plan`, `file_cleanup`, `social_pack`);
- `version: string` — версія процедури (наприклад, `v1`, `v1.1`);
- `origin_type: string` — `baseline` | `candidate` | `merged`;
- `origin_ref: string` — посилання на джерело (наприклад, `human_as_is`, `agent:chatgpt_main`);
- `steps: array` з елементами:
  - `step_id: string`;
  - `name: string` — коротка назва кроку;
  - `description: string`;
  - `actor_role: string` — посилання на роль (людина / агент / сервіс);
  - `inputs: array` (список логічних вхідних даних);
  - `outputs: array` (список логічних вихідних даних);
  - `tools: array` (нестрогий список інструментів / skills / env.*);
- `meta: object` — довільні службові метадані;
- `ext: object` — розширення для конкретних доменів.

---

## 3. Схема: ds.lab_workflow_experiment_config_v1

**Призначення:** опис умов експерименту з воркфлоу.

Мінімальні поля:

- `experiment_id: string` — унікальний ідентифікатор;
- `title: string`;
- `description: string`;
- `baseline_procedure_id: string`;
- `domain: string`;
- `agent_profiles: array`:
  - `agent_id: string`;
  - `model_family: string` (наприклад, `gpt`, `gemini`, `qwen`);
  - `profile_id: string` (наприклад, `chatgpt_main`, `codex_vscode_main`);
- `metrics: array`:
  - `metric_id: string`;
  - `name: string`;
  - `description: string`;
  - `direction: string` — `maximize` | `minimize`;
- `constraints: array` (список текстових обмежень — що не можна змінювати);
- `test_data_ref: string` — посилання на набір тестових кейсів (файл / dataset);
- `meta: object`;
- `ext: object`.

---

## 4. Схема: ds.lab_workflow_experiment_result_v1

**Призначення:** зафіксувати результати експерименту.

Мінімальні поля:

- `experiment_id: string` — посилання на config;
- `summary: string` — короткий текстовий підсумок;
- `variants: array`:
  - `procedure_id: string`;
  - `agent_id: string`;
  - `profile_id: string`;
  - `runs_count: integer`;
  - `metrics: array`:
    - `metric_id: string`;
    - `value: number`;
    - `unit: string`;
  - `pros: array` (список сильних сторін);
  - `cons: array` (список слабких місць);
- `recommended_procedure_id: string` — обраний варіант або merged-процедура;
- `notes: array` — додаткові зауваження для майбутніх експериментів;
- `meta: object`;
- `ext: object`.

---

## 5. Схеми епізодів (reuse + extension)

Для епізодів експериментів використовується вже існуюча базова схема епізоду (mova episode core).  
Додатково в полі `data` епізоду має бути дозволено вказувати:

- `experiment_id`;
- `procedure_id`;
- `agent_id` / `profile_id`;
- `run_index`;
- `metrics_snapshot` — виміряні метрики для конкретного запуску.

Ці доповнення оформлюються як **окремий lab-рівень** схеми:

- `ds.lab_workflow_episode_data_v1` — схема для вмісту поля `data` у generic episode.

---

## 6. Конверти (env.*)

Необхідний мінімальний набір конвертів:

1. **env.lab_workflow_experiment_plan_request_v1**  
   - Призначення: створити `lab_workflow_experiment_config` на основі опису as-is процедури та цілей.

2. **env.lab_workflow_variant_generate_request_v1**  
   - Призначення: згенерувати новий `lab_workflow_procedure` як кандидат на основі:
     - baseline_procedure_id;
     - agent_profile;
     - experiment_config.

3. **env.lab_workflow_variant_run_request_v1**  
   - Призначення: запустити процедуру (baseline або варіант) на наборі кейсів і створити епізоди.

4. **env.lab_workflow_experiment_aggregate_request_v1**  
   - Призначення: зібрати епізоди по experiment_id, порахувати метрики, створити `lab_workflow_experiment_result`.

Для кожного конверта:

- Структура запиту узгоджується з поточним envelope-форматом MOVA 4.0.0 (id, type, time, source, payload тощо).  
- В `payload` повинні посилатися вищеописані ds.lab_* схеми.

---

## 7. Вихідні артефакти

В результаті реалізації цього ТЗ в репозиторії має з’явитися:

- каталоги зі схемами:
  - `schemas/lab/ds.lab_workflow_procedure_v1.schema.json`
  - `schemas/lab/ds.lab_workflow_experiment_config_v1.schema.json`
  - `schemas/lab/ds.lab_workflow_experiment_result_v1.schema.json`
  - `schemas/lab/ds.lab_workflow_episode_data_v1.schema.json`
- каталоги з конвертами:
  - `envelopes/lab/env.lab_workflow_experiment_plan_request_v1.schema.json`
  - `envelopes/lab/env.lab_workflow_variant_generate_request_v1.schema.json`
  - `envelopes/lab/env.lab_workflow_variant_run_request_v1.schema.json`
  - `envelopes/lab/env.lab_workflow_experiment_aggregate_request_v1.schema.json`

Тести та приклади будуть описані окремо у документі з першим тестовим патерном запуску.

---

## 8. Відповідність доменному патерну
Цей набір ds./env. схем достатній для типової послідовності доменного експерименту (див. `docs/PROJECT_MEMORY/lab_workflow_pattern_domain_experiment_v1.md`): опис процедур, конфігів, епізодів та результатів, плюс конверти для планування/генерації/запуску/агрегації. Доменні пакети (наприклад, SmartLink) доповнюють цей базис власними ds/env, але не змінюють цей каркас.
