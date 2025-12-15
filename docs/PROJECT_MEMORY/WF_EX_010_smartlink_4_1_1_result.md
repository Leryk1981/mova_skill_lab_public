# WF_EX_010 SmartLink 4.1.1 — baseline vs candidate (result & verdict)

## Посилання
- Config: `lab/examples/ds.lab_workflow_experiment_config_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Plan result: `lab/examples/env.lab_workflow_experiment_plan_result_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Apply episode: `lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_010_smartlink_4_1_1_apply.json`
- Run result (ds): `lab/examples/ds.lab_workflow_experiment_result_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json`
- Episode (run): `lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_010_smartlink_4_1_1_result.json`
- Baseline dir: `lab/experiments/smartlink_baseline/mova_smartlink/schemas/`
- Candidate dir: `lab/experiments/smartlink_4_1_1_candidate_ex010/`

## Scope (нагадування)
- ✅ `ds.smartlink.rules.v1`
- ✅ `env.smartlink.default.v1`
- ✅ `global.smartlink.v1`
- ✅ `meta.smartlink.v1`
- 🚫 worker/src/config/tests/deploy — поза scope WF_EX_010.

## Пер-файл результат
- **ds.smartlink.rules.v1**: candidate = baseline логіка, але нормалізовано під MOVA 4.1.1 (referrer, debug, spec_alignment). Вердикт: equal but normalized to spec.
- **env.smartlink.default.v1**: mova_version 4.1.1, outputs з decision/debug, явні references на rules/global/meta та text channel `smartlink.redirected`. Вердикт: strictly better.
- **global.smartlink.v1**: очищено до мінімально потрібних roles/resources/text_channels; додано `smartlink.redirected`. Вердикт: equal but normalized to spec.
- **meta.smartlink.v1**: пакет під 4.1.1 з policy/scope/out-of-scope та посиланнями на candidate артефакти. Вердикт: strictly better.

## Загальний вердикт WF_EX_010
- Candidate SmartLink 4.1.1 (четвірка JSON) вважається **best-so-far** у лабораторії для rules/env/global/meta.
- Борги: деталізувати payload/validation для `smartlink.redirected`; за потреби винести normalize/evaluate у окремі ds/env; залишити worker/infra поза цією серією.

## Next Steps
- Якщо потрібен додатковий цикл: WF_EX_011 для уточнення observability/debug (подія smartlink.redirected, decision payload).
- Якщо приймаємо як best-so-far: підготувати фінальний WF_LAB-епізод для фіксації “SmartLink best-so-far 4.1.1” і план переносу четвірки JSON у прод-репозиторій SmartLink.
