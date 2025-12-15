# WF_EX_010 SmartLink 4.1.1 — застосування плану (candidate vs baseline)

## Посилання
- Config: `lab/examples/ds.lab_workflow_experiment_config_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Plan request: `lab/examples/env.lab_workflow_experiment_plan_request_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Plan result: `lab/examples/env.lab_workflow_experiment_plan_result_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Episode (apply): `lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_010_smartlink_4_1_1_apply.json`
- Baseline dir: `lab/experiments/smartlink_baseline/mova_smartlink/schemas/`
- Candidate dir: `lab/experiments/smartlink_4_1_1_candidate_ex010/`

## Scope (нагадування)
- ✅ `ds.smartlink.rules.v1`
- ✅ `env.smartlink.default.v1`
- ✅ `global.smartlink.v1`
- ✅ `meta.smartlink.v1`
- 🚫 worker/src/config/tests/deploy — поза scope WF_EX_010.

## Порівняння по файлах
- **ds.smartlink.rules.v1**: додано підтримку `referrer`, debug-флаг, вирівняно опис під MOVA 4.1.1 (spec_alignment, $comment). Базова логіка правил збережена (when/target, start/end, weight, UTM).
- **env.smartlink.default.v1**: оновлено до mova_version 4.1.1, додано decision/debug у outputs, явні посилання на rules/global/meta та text channel `smartlink.redirected`; планові кроки залишилися без worker/infra деталей.
- **global.smartlink.v1**: зведено до ролей/resources/text_channels, які реально потрібні rules/env; додано `smartlink.redirected` як text channel з ключовими полями.
- **meta.smartlink.v1**: опис пакета під MOVA 4.1.1 (id/compatibility/policy), посилання на артефакти кандидата, зафіксовано scope і out-of-scope (worker/infra).

## Відповідність MOVA 4.1.1
- Security/text/global catalogs: додано text channel `smartlink.redirected`, узгоджено правила/envelope з глобальними словниками і зазначено spec_alignment у rules/meta.
- Meta/policy: явний статус `experimental`, обмеження на scope (4 JSON), посилання на spec 4.1.1.
- Борги/далі: деталізувати event payload/validation для smartlink.redirected, зафіксувати інструкції/перетворення normalize/evaluate як окремі ds/env якщо знадобиться.

## Next Steps
- WF_EX_010 run/compare: зафіксувати фактичне порівняння baseline vs candidate на цих 4 файлах і вердикт (result епізод + markdown).
- Додаткові покращення (за потреби): уточнити text-channel/event схеми й кінцеву форму decision/debug виходу.
