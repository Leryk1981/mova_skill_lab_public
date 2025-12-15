0. Принципи перед стартом

Lab-first policy (обов’язкова):

У mova-spec-4.x (червоне ядро) на цьому етапі нічого не змінюємо.

Усі нові схеми/конверти DPP живуть спочатку в mova_skills_lab як:

або ds.lab_* (кандидати в core),

або ds.dpp_* (доменні схеми).

Промоція в ядро тільки через епізоди:

Схема/конверт може претендувати на ядро тільки після:

принаймні 1–2 реальних/синтетичних сценаріїв (епізодів),

аналізу, що вона корисна не тільки для DPP, а як загальний патерн (social, e-commerce, security).

Два окремих документи:

ТЗ (вже є — описує концепції).

Цей документ — план реалізації DPP Base Pack v0.1 у Skills Lab.

1. Фаза L0 — Підготовка лабораторії
L0.1. Гілка і простір у mova_skills_lab

Створити гілку, наприклад:
feature/dpp-base-pack-v0.1.

У docs/PROJECT_MEMORY/ створити:

PROGRESS_DPP_LAB.md — трекер задач,

DECISIONS_DPP_LAB.md — рішення по DPP.

L0.2. Фіксація принципу «lab-only»

У DECISIONS_DPP_LAB.md окремим пунктом:

«Будь-які схеми й конверти, створені в рамках DPP,
не переносяться в mova-spec-4.x без:

тестування на епізодах у лабораторії;

окремого рішення про промоцію в core».

Артефакти Фази L0:

Створена гілка feature/dpp-base-pack-v0.1.

Ініціалізовано PROGRESS_DPP_LAB.md + DECISIONS_DPP_LAB.md.

2. Фаза L1 — Лабораторні схеми ds.lab_* + доменні ds.dpp_*
L1.1. Лабораторні кандидати в core (namespace ds.lab_*)

У skills_lab (наприклад, lab/schemas/ або lab/core_experimental/):

ds.lab_regulation_requirement_v1.schema.json
(аналог нашого ds.regulation_requirement_v1, але явно як lab-версія).

ds.lab_episode_signature_v1.schema.json.

ds.lab_traceability_summary_v1.schema.json.

ds.lab_episode_aggregate_v1.schema.json.

ds.lab_external_source_ref_v1.schema.json.

Вимоги:

Структура — як у ТЗ, але з lab_ у $id та назві:

$id: https://mova.dev/lab/schemas/ds.lab_regulation_requirement_v1.schema.json.

Чіткий коментар у кожній схемі:

"$comment": "LAB-EXPERIMENTAL. Core candidate after real-world evaluation."

L1.2. DPP-доменні схеми (namespace ds.dpp_*)

У цьому ж репо, але інший каталог, наприклад lab/domains/dpp/:

ds.dpp_battery_passport_minimal_v1.schema.json.

ds.dpp_battery_passport_full_v1.schema.json.

Об’єднувальна схема ds.dpp_battery_passport_v1.schema.json:

allOf → minimal + full.

У цих схемах:

посилання на ds.lab_traceability_summary_v1,

посилання на ds.lab_external_source_ref_v1,

meta.reg_requirement_ref → ds.lab_regulation_requirement_v1.

Артефакти Фази L1:

Коміт з новими lab-схемами і dpp-схемами (тільки структура, без наворочених прикладів).

3. Фаза L2 — Лабораторні env-конверти env.lab_* + DPP-конверти
L2.1. Універсальні lab-конверти (кандидати в core)

Namespace: env.lab_*, каталог lab/env/:

env.lab_schema_change_request_v1.schema.json
(наш env.schema_change_request_v1, але в lab-просторі).

env.lab_episode_archive_v1.schema.json.

env.lab_episode_aggregate_v1.schema.json.

Ці конверти будуть використовуватись не тільки DPP, а й іншими lab-проєктами (Social, e-commerce) як тестовий приклад.

L2.2. DPP-специфічні env-конверти

Namespace: env.dpp_*, каталог lab/domains/dpp/env/:

env.dpp_export_v1.schema.json.

env.dpp_passport_read_v1.schema.json.

Принцип:

Все, де є «dpp», точно не претендує на core.

Все, де є «lab», — потенційний кандидат, але тільки після епізодів.

Артефакти Фази L2:

Коміт з env.lab_* і env.dpp_*.

4. Фаза L3 — Перші скіли й потоки в лабораторії
L3.1. Skill: regulation → schema (lab-first)

Створити в skills/dpp_regulation_to_schema_basic/:

ds.dpp_regulation_to_schema_request_v1

regulation_profile_id,

target_domain ("battery_passport"),

опції.

ds.dpp_regulation_to_schema_response_v1

generated_schema (чернетка ds.dpp_battery_passport_full_v1),

coverage,

unmapped_requirements[] (посилання на ds.lab_regulation_requirement_v1).

env.dpp_regulation_to_schema_generate_v1
(використовується skill’ом для запуску).

Задача скіла:
На основі профілю регуляції (тимчасово — навіть ручного JSON з вимогами) видати чернетку схем DPP.

L3.2. Skill: manufacturer data → dpp passport

Другий skill: skills/dpp_passport_normalize_basic/:

Вхід:

сирі дані виробника (ERP JSON / CSV-поля),

посилання на профіль регуляції (regulation_profile_id).

Вихід:

валідний ds.dpp_battery_passport_v1,

поле traceability заповнене через ds.lab_traceability_summary_v1,

source_refs з ds.lab_external_source_ref_v1.

Використовує:

env.dpp_regulation_to_schema_generate_v1 (може),

або вже затверджену схему ds.dpp_battery_passport_v1.

Артефакти Фази L3:

Два skill-паки з описаними вхід/вихід ds + env, без складної реалізації (навіть якщо фактичний код — TODO).

5. Фаза L4 — Епізоди як доказ придатності

Це ключова фазa: без епізодів у нас немає права говорити про ядро.

L4.1. Сценарій «від регуляції до паспорта»

Задати один повний сценарій (synthetic, але максимально реалістичний):

Регулятор / профіль:

EU_BATTERY_REG_2023 + annex_xiii_v1 у вигляді лабораторного профілю (простий JSON з requirements).

Крок 1:

Виклик env.dpp_regulation_to_schema_generate_v1
→ епізод episode.dpp_lab_schema_generated_v1 (з посиланнями на ds.lab_regulation_requirement_v1).

Крок 2:

Завантаження даних виробника (ERP/CSV) → skill dpp_passport_normalize_basic
→ епізод episode.dpp_lab_passport_created_v1 з:

signature? (якщо хочеш вже тестувати lab-підпис),

traceability,

external_source_ref.

Крок 3:

Виклик env.dpp_export_v1 з target_format="native_json" (для початку).
→ епізод episode.dpp_lab_exported_v1.

Крок 4:

Виклик env.dpp_passport_read_v1 з view_level="public".
→ епізод episode.dpp_lab_viewed_public_v1.

L4.2. Формат епізодів у лабораторії

Можливі варіанти:

або використовуєш уже наявний ds.episode_core_v1 з meta.domain = "dpp_lab",

або вводиш ds.lab_dpp_episode_v1 (але, чесно, краще повторно використати core-подібний шаблон, щоб потім не переписувати).

Головне: усі кроки сценарію мають бути зафіксовані як JSON-епізоди в lab/fixtures/episodes/dpp/.

L4.3. Критерії «епізодів достатньо»

Для кожного lab-* кандидата робимо таблицю (наприклад у PROGRESS_DPP_LAB.md):

ds.lab_regulation_requirement_v1:

 Використовується в профілі DPP (Annex XIII).

 Використовується в схемі ds.dpp_battery_passport_v1.

 Хоча б в 1 епізоді видно зв’язок requirement → поле.

ds.lab_traceability_summary_v1:

 Заповнена traceability для cobalt/lithium.

 Присутня в 1–2 епізодах створення паспорта.

І так далі.

Артефакти Фази L4:

Набір JSON-епізодів у lab/fixtures/episodes/dpp/.

Таблиця використання lab-схем по епізодах у PROGRESS_DPP_LAB.md.

6. Фаза L5 — Аналітика: хто «дозрів» до core
L5.1. Документ «CORE_CANDIDATES_DPP_LAB.md»

У docs/PROJECT_MEMORY/ створити:

CORE_CANDIDATES_DPP_LAB.md з розділами по кожній lab-схемі/конверту:

Опис (що робить).

Де використовується (які dpp-схеми, які епізоди).

Чи бачимо потенціал поза DPP:

Social Pack?

E-commerce сертифікати?

Security-шар?

L5.2. Рішення

У DECISIONS_DPP_LAB.md зафіксувати:

Наприклад:

ds.lab_regulation_requirement_v1 — потенційний core (кандидат 4.1.x).

ds.lab_external_source_ref_v1 — потенційний core.

ds.lab_traceability_summary_v1 — поки що тільки DPP-specific (залишити в lab/domain).

env.lab_schema_change_request_v1 — потенційний core для всіх проєктів.

На цьому етапі ми ще не чіпаємо mova-spec, тільки формулюємо «проміжний вердикт».

7. Фаза L6 — (потім) окремий план для переносу в ядро

Це не частина поточного плану, але логічний наступний крок:

Коли буде час, окремим документом:

«MOVA 4.1.x Core Promotion Plan from DPP Lab»
із чистим списком:

які ds.lab_* переносяться в mova-spec як ds.*,

які env.lab_* стають env.* в ядрі,

як міняються $id, які потрібні міграційні нотатки.

Поки що це просто «якір» на майбутнє.

8. Підсумковий чек-ліст для DPP Base Pack v0.1 (Lab)

Можна прямо вставити в PROGRESS_DPP_LAB.md:

Фаза L0 — Підготовка

 L0.1: Створена гілка feature/dpp-base-pack-v0.1.

 L0.2: Ініціалізовано PROGRESS_DPP_LAB.md, DECISIONS_DPP_LAB.md з принципом lab-first.

Фаза L1 — ds.lab_ + ds.dpp_**

 L1.1: Додано ds.lab_regulation_requirement_v1, ds.lab_episode_signature_v1, ds.lab_traceability_summary_v1, ds.lab_episode_aggregate_v1, ds.lab_external_source_ref_v1.

 L1.2: Додано ds.dpp_battery_passport_minimal_v1, ds.dpp_battery_passport_full_v1, ds.dpp_battery_passport_v1.

Фаза L2 — env.lab_ + env.dpp_**

 L2.1: Додано env.lab_schema_change_request_v1, env.lab_episode_archive_v1, env.lab_episode_aggregate_v1.

 L2.2: Додано env.dpp_export_v1, env.dpp_passport_read_v1.

Фаза L3 — Skills

 L3.1: Skill dpp_regulation_to_schema_basic (ds/ env визначені).

 L3.2: Skill dpp_passport_normalize_basic (ds/ env визначені).

Фаза L4 — Епізоди

 L4.1: Прописаний сценарій «regulation → schema → passport → export → read».

 L4.2: Збережено JSON-епізоди в lab/fixtures/episodes/dpp/.

 L4.3: Таблиця використання lab-схем в епізодах.

Фаза L5 — Оцінка core-кандидатів

 L5.1: Створено CORE_CANDIDATES_DPP_LAB.md.

 L5.2: В DECISIONS_DPP_LAB.md зафіксовано, які lab-схеми претендують на core, які лишаються доменними.