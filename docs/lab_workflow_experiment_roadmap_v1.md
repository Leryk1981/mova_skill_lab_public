# Дорожня карта модернізації лабораторії воркфлоу

**Проєкт:** MOVA Skills Lab  
**Фокус:** підтримка експериментів з воркфлоу та конкуренції моделей  
**Горизонт:** 2–4 ітерації роботи в IDE

---

## Фаза 0 — Фіксація концепції (цей архів)

✅ Результат фази:

- текстовий опис лабораторії воркфлоу (overview);
- ТЗ на схеми та конверти (schemas_tz);
- опис першого тестового патерну (first_pattern);
- дорожня карта (цей документ).

Це артефакти **для старту нового чату / гілки** в конкретному репозиторії.

---

## Фаза 1 — Реалізація схем та конвертів

**Ціль:** додати в репозиторій MOVA Skills Lab мінімальний набір lab-схем і конвертів.

### Кроки

1. Створити нову гілку, наприклад:  
   - `feature/lab-workflow-experiments-v1`.

2. Додати JSON Schema файли:
   - `schemas/lab/ds.lab_workflow_procedure_v1.schema.json`
   - `schemas/lab/ds.lab_workflow_experiment_config_v1.schema.json`
   - `schemas/lab/ds.lab_workflow_experiment_result_v1.schema.json`
   - `schemas/lab/ds.lab_workflow_episode_data_v1.schema.json`

3. Додати schema-тести (перевірка валідності через існуючий mova-check / інші інструменти).

4. Додати envelope-схеми:
   - `envelopes/lab/env.lab_workflow_experiment_plan_request_v1.schema.json`
   - `envelopes/lab/env.lab_workflow_variant_generate_request_v1.schema.json`
   - `envelopes/lab/env.lab_workflow_variant_run_request_v1.schema.json`
   - `envelopes/lab/env.lab_workflow_experiment_aggregate_request_v1.schema.json`

5. Оновити каталоги / index-файли (якщо використовуються):
   - додати нові схеми в реєстр;
   - додати приклади порожніх payload-ів.

**Критерій завершення:** усі нові схеми й конверти проходять валідацію, є хоча б по одному мінімальному JSON-прикладу.

---

## Фаза 2 — Жовті скіли для воркфлоу-експериментів

**Ціль:** додати базові скіли для роботи з новими схемами.

### Необхідні скіли

1. `skill.workflow_experiment_plan_basic`
   - Вхід: опис домену, початковий as-is воркфлоу.  
   - Вихід: `ds.lab_workflow_experiment_config_v1`.

2. `skill.workflow_variant_generate_basic`
   - Вхід: baseline_procedure + experiment_config + agent_profile.  
   - Вихід: новий `ds.lab_workflow_procedure_v1` (candidate).

3. `skill.workflow_variant_run_basic`
   - Вхід: procedure_id + test_data_ref + context.  
   - Вихід: набір епізодів з `lab_workflow_episode_data_v1`.

4. `skill.workflow_experiment_aggregate_basic`
   - Вхід: experiment_id.  
   - Вихід: `ds.lab_workflow_experiment_result_v1` + людський звіт (markdown).

### Кроки

1. Створити каталоги skill-описів (як у поточних skills).  
2. Для кожного skill:
   - описати contract (input/output) через MOVA-схеми;
   - додати мінімальні приклади env-запусків;
   - додати тести (якщо в Skills Lab є загальний runner для skills).

**Критерій завершення:** усі чотири скіли мають опис, приклади та можуть бути викликані вручну через env-файли.

---

## Фаза 3 — Перший експеримент WF-EX-001

**Ціль:** виконати перший повний цикл експерименту `WF-EX-001`.

### Кроки

1. Оформити as-is воркфлоу `wf_repo_change_plan_baseline_v1` у форматі `lab_workflow_procedure`.  
2. Створити `lab_workflow_experiment_config` для `WF-EX-001` згідно з документом first_pattern.  
3. Для кожного `agent_profile`:
   - викликати `env.lab_workflow_variant_generate_request_v1`;  
   - отримати й зафіксувати candidate-процедури.
4. Визначити 3–5 реальних задач на зміну коду в одному з репозиторіїв (DPP-lab / Skills Lab).  
5. Для кожного варіанту процедури й кожної задачі:
   - реально пройти воркфлоу (людина + агент);
   - зафіксувати епізоди (час, ітерації, помилки, суб’єктивну складність).
6. Викликати `env.lab_workflow_experiment_aggregate_request_v1` для `experiment_id = "WF-EX-001"`.  
7. Зберегти результат як JSON + markdown-звіт у каталозі `lab/examples/`.

**Критерій завершення:**  
- Є повний набір артефактів (config, procedures, episodes, result).  
- Є людський звіт з висновками й рекомендаціями щодо покращеного воркфлоу.

---

## Фаза 4 — Полірування та генералізація

**Ціль:** перетворити перший експеримент на стабільний патерн для інших доменів.

Можливі кроки:

1. Витягнути спільні частини експерименту в універсальний патерн (template) для інших воркфлоу.  
2. Додати базові UI-/IDE-дії (наприклад, команди у Workbench / Skills Lab) для запуску експериментів з воркфлоу.  
3. Зафіксувати best practices у окремому guide-документі (як правильно описувати воркфлоу, метрики, constraints).  
4. Опціонально — винести частину схем/патернів у більш стабільний шар (жовтий / окремий пакет), якщо експерименти покажуть їхню універсальність.

**Критерій завершення:**  
- WF-EX-001 пройдено, висновки інтегровані в код і документи;  
- є зрозуміла інструкція, як запустити WF-EX-00X для іншого домену (наприклад, Smartlink, file_cleanup, social_pack).
