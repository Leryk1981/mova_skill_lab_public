# WF_EX_010 SmartLink 4.1.1 — план експерименту (каркас)

## Посилання
- Config: `lab/examples/ds.lab_workflow_experiment_config_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Plan request envelope: `lab/examples/env.lab_workflow_experiment_plan_request_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Плановий епізод (JSON): `lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_010_smartlink_4_1_1_plan_stub.json`

## Контекст
- Baseline (read-only): `lab/experiments/smartlink_baseline/` — стабільні SmartLink схеми у `mova_smartlink/schemas/`.
- Історичний кандидат v1 (read-only): `lab/experiments/smartlink_codex_candidate/` — попередній Codex-кандидат (config/src/tests).
- Новий кандидат під 4.1.1: `lab/experiments/smartlink_4_1_1_candidate_ex010/` — робочий каталог для MOVA 4.1.1 (schemas/envelopes/examples/worker).
- Норматив: `spec/mova-spec-4.1.1/` (security layer, operator frame, text channels, catalogs); ядро Skills Lab лишається на MOVA 4.0.0.

## Scope експерименту
- ✅ `ds.smartlink.rules.v1`
- ✅ `env.smartlink.default.v1`
- ✅ `global.smartlink.v1`
- ✅ `meta.smartlink.v1`
- 🚫 все інше (worker, src, config, tests, deploy) — поза scope WF_EX_010.

## Що порівнюємо baseline vs candidate
- Структура та поля `ds.smartlink.rules.v1`.
- Структура/активні поля `env.smartlink.default.v1` і їх зв’язок із rules.
- Узгодженість словників/каталогів у `global.smartlink.v1` із правилами/енвелопом.
- Опис пакета/версій/політик у `meta.smartlink.v1`.

## Planned Scope (кейси)
- Простий redirect з fallback.
- Geo/lang/device-умови для вибору таргету.
- UTM/referrer campaign override.
- Debug/preview: повернення decision/target/debug-даних.
- Observability: подія click/redirect з типізованим payload.

## Next Steps
- Запустити планувальник за envelope WF_EX_010 плану; очікуваний вихід — plan_result JSON з кроками/файлами/гепами для цієї четвірки файлів.
- Оновити JSON-епізод планування фактичними даними (status/result).
- Створити окремий markdown-епізод “plan_result” після отримання результату планування.
