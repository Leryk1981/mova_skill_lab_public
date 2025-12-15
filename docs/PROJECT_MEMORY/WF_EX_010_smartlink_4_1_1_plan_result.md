# WF_EX_010 SmartLink 4.1.1 — результат плану (plan_result)

## Посилання
- Config: `lab/examples/ds.lab_workflow_experiment_config_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
*- Plan request: `lab/examples/env.lab_workflow_experiment_plan_request_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Plan result: `lab/examples/env.lab_workflow_experiment_plan_result_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Episode (plan): `lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_010_smartlink_4_1_1_plan_stub.json`

## Scope (нагадування)
- ✅ `ds.smartlink.rules.v1`
- ✅ `env.smartlink.default.v1`
- ✅ `global.smartlink.v1`
- ✅ `meta.smartlink.v1`
- 🚫 worker/src/config/tests/deploy — поза scope WF_EX_010.

## Plan Summary
- Кроки (4):
  - `rules.align.fields` — звірити rules vs env та MOVA 4.1.1 security/text catalogs (гео/мова/пристрій/utm/referrer/debug, вікна, ваги, fallback_target).
  - `env.align.contract` — уточнити envelope (request/response, decision/target/debug), прив'язка до rules та вимог security/text-channel.
  - `global.catalog.align` — синхронізувати глобальні словники/каталоги з rules/env і MOVA 4.1.1 global catalogs.
  - `meta.package.describe` — зафіксувати версію пакета, залежність від MOVA 4.1.1, policy/constraints, scope (4 JSON) та out-of-scope (worker).
- Групування:
  - ds.smartlink.rules.v1: `rules.align.fields`
  - env.smartlink.default.v1: `env.align.contract`
  - global.smartlink.v1: `global.catalog.align`
  - meta.smartlink.v1: `meta.package.describe`
- Out-of-scope steps: будь-які дії з worker/src/config/tests/deploy (ігноруються, якщо зустрінуться).

## Next Steps
- WF_LAB_SMARTLINK_4_1_1_05: застосувати план до кандидата `lab/experiments/smartlink_4_1_1_candidate_ex010/` у межах 4 JSON-файлів (rules/env/global/meta).
- Зафіксувати оновлені файли, потім виконати порівняння baseline vs candidate (епізод run) і підготувати result markdown.
