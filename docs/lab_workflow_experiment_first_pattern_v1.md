# Перший тестовий патерн запуску лабораторії воркфлоу

**Назва кейсу:** `WF-EX-001: repo_change_plan_workflow_baseline_vs_agents`  
**Домен:** MOVA / DPP / Skills Lab  
**Мета:** порівняти базовий воркфлоу “repo snapshot → change plan → apply step” з варіантами, згенерованими різними моделями.

---

## 1. Контекст

У наявних проєктах (DPP-lab, mova_skills_lab) вже використовується типовий цикл:

1. Зняти знімок репозиторію (`repo_snapshot`).  
2. Згенерувати план змін (`repo_change_plan`).  
3. Виконати одну або кілька зміних кроків у IDE.  
4. Зафіксувати результати (епізоди, decision log).

Цей процес зручно взяти як **перший базовий воркфлоу** для лабораторії, бо:

- він уже відпрацьований на практиці;
- залучає IDE-агентів (Codex/Gemini/Qwen);
- має чіткі метрики (час, кількість ітерацій, кількість помилок).

---

## 2. Базовий воркфлоу (as-is)

Базовий процес описується як `ds.lab_workflow_procedure_v1` з умовним id:

- `procedure_id: "wf_repo_change_plan_baseline_v1"`  
- `domain: "repo_change_plan"`  
- `origin_type: "baseline"`  
- `origin_ref: "human_as_is"`

Скорочений опис кроків:

1. Крок 1: Вибрати репозиторій і гілку.  
2. Крок 2: Запустити skill `repo_snapshot_basic` і зберегти результат.  
3. Крок 3: Сформулювати задачу для зміни (L- / T- рівень).  
4. Крок 4: Запустити skill `repo_code_change_plan_basic` для генерації плану.  
5. Крок 5: Відкрити IDE, виконати крок(и) плану вручну за участі агента.  
6. Крок 6: Запустити тести / перевірки.  
7. Крок 7: Зафіксувати епізод (опис змін, час, проблеми).

Цей опис буде першим заповненим прикладом `lab_workflow_procedure`.

---

## 3. Конфігурація експерименту

Експеримент описується як `ds.lab_workflow_experiment_config_v1` з id:

- `experiment_id: "WF-EX-001"`  
- `title: "Repo change plan workflow: baseline vs agents"`  
- `baseline_procedure_id: "wf_repo_change_plan_baseline_v1"`  
- `domain: "repo_change_plan"`

### 3.1. Учасники (agent_profiles)

Мінімальний набір учасників:

1. `agent_id: "chatgpt_main"`  
   - `model_family: "gpt"`  
   - `profile_id: "chatgpt_main"`  
   - Контекст: чат у браузері.

2. `agent_id: "codex_vscode_main"`  
   - `model_family: "gpt"` (або інше фактичне значення);  
   - `profile_id: "codex_vscode_main"`;  
   - Контекст: IDE-агент у VS Code.

3. (опційно) `agent_id: "gemini_repo_agent"`  
   - `model_family: "gemini"`;  
   - `profile_id: "gemini_repo_agent"`;  
   - Контекст: repo-агент у IDE / окремому інтерфейсі.

### 3.2. Метрики

Базовий набір метрик:

- `metric_id: "total_time_minutes"` — час від початку до завершення зміни (хвилини), `direction: "minimize"`;  
- `metric_id: "iterations_count"` — кількість ітерацій / циклів між людиною та агентом, `direction: "minimize"`;  
- `metric_id: "errors_count"` — кількість редагувань після невдалих спроб (падіння тестів, відкат змін), `direction: "minimize"`;  
- `metric_id: "subjective_load"` — суб’єктивна складність для людини (шкала 1–5), `direction: "minimize"`.

### 3.3. Обмеження (constraints)

- Не змінювати структуру репозиторію радикально (лише локальні правки).  
- Не додавати нові залежності без явної потреби.  
- Зберегти сумісність із наявними сценаріями Skills Lab / DPP-lab.  
- Весь обмін даними має залишатися в межах MOVA Skills Lab (local repo, без зовнішніх secret-даних).

---

## 4. Сценарій запуску експерименту

1. **Підготовка:**
   - Заповнити `lab_workflow_procedure` для базового процесу.  
   - Створити `lab_workflow_experiment_config` для `WF-EX-001`.  
   - Визначити 3–5 конкретних задач на зміну коду (наприклад, невеликі refactor-и чи додавання поля у схему).

2. **Генерація кандидатів:**
   - Для кожного `agent_profile` викликати конверт `env.lab_workflow_variant_generate_request_v1`.  
   - Отримати 2–3 варіанти процедури на агента (за потреби).

3. **Запуск варіантів:**
   - Для кожного варіанту процедури і кожної задачі:
     - виконати процедуру в реальних умовах (людина + агент/IDE);  
     - заміряти час, порахувати ітерації/помилки;  
     - зафіксувати окремий епізод через generic episode-схему з `lab_workflow_episode_data`.

4. **Агрегація результатів:**
   - Викликати `env.lab_workflow_experiment_aggregate_request_v1` з посиланням на `experiment_id`.  
   - Отримати `lab_workflow_experiment_result` з:
     - середніми значеннями метрик по кожному варіанту;  
     - текстовим резюме сильних/слабких сторін;  
     - рекомендацією, який воркфлоу зробити новим базовим, чи потрібен merged-вариант.

---

## 5. Очікуваний результат пілота

Після завершення `WF-EX-001` ми очікуємо отримати:

1. Повністю заповнені JSON-файли:
   - `ds.lab_workflow_procedure_v1` для базового і кандидатних процедур;
   - `ds.lab_workflow_experiment_config_v1` для `WF-EX-001`;
   - `ds.lab_workflow_experiment_result_v1` з підсумками;
   - епізоди з `lab_workflow_episode_data_v1`.

2. Практичне розуміння того, які поля в схемах:
   - реально корисні й мають потрапити в стабільну версію;
   - зайві або потребують уточнення.

3. Оновлений, покращений воркфлоу для роботи з репозиторіями, який можна використовувати як еталон у наступних експериментах.

---

### Зв’язок із загальним доменним патерном
Патерн `WF-EX-001` (repo_change_plan) є першим прикладом загального доменного сценарію: baseline процедура → експериментальна конфігурація → запуск варіантів → результат. Той самий підхід застосовано для SmartLink у `WF-EX-003` (baseline SmartLink Schemas vs MOVA-пак). Узагальнений чекліст для будь-якого домену описано в `docs/PROJECT_MEMORY/lab_workflow_pattern_domain_experiment_v1.md`.
