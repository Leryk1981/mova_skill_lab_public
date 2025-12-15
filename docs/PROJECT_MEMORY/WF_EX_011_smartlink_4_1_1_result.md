# WF_EX_011 SmartLink 4.1.1 Observability — baseline vs Codex (result & verdict)

## Посилання
- Config: `lab/examples/ds.lab_workflow_experiment_config_v1.WF_EX_011_smartlink_4_1_1_observability.json`
- Plan result: `lab/examples/env.lab_workflow_experiment_plan_result_v1.WF_EX_011_smartlink_4_1_1_observability.json`
- Apply (Codex): `lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_011_smartlink_4_1_1_apply_codex.json`
- Run result (ds): `lab/examples/ds.lab_workflow_experiment_result_v1.WF_EX_011_smartlink_4_1_1_observability.json`
- Episode (run): `lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_011_smartlink_4_1_1_result.json`
- Baseline dir: `lab/experiments/smartlink_4_1_1_candidate_ex010/`
- Codex dir: `lab/experiments/smartlink_4_1_1_candidate_ex011_codex/`

## Scope (нагадування)
- ✅ `ds.smartlink.redirect_event.v1`
- ✅ `env.smartlink.redirect_event.v1`
- ✅ Доповнення до `global.smartlink.v1` (events/text channel)
- ✅ Доповнення до `meta.smartlink.v1` (observability/events)
- 🚫 worker/src/config/tests/deploy, rules/env.default — поза scope WF_EX_011.

## Порівняння ChatGPT vs Codex
- **ds.smartlink.redirect_event.v1**
  - ChatGPT: повний payload A–F, багато полів, debug/raw_context без чіткого відділення.
  - Codex: компактний core (link/decision/routing/context/traffic), окремий debug, керований, менше шуму.
  - Вердикт: Codex — краща читабельність та розділення core/debug.
- **env.smartlink.redirect_event.v1**
  - ChatGPT: inputs request_context+decision, без явного перемикача debug.
  - Codex: inputs context+decision+debug_mode, явне maybe_attach debug; план відокремлює core і debug емісію.
  - Вердикт: Codex — чіткіший контроль debug, простіший inputs.
- **global.smartlink.v1 (events)**
  - ChatGPT: розширений global із ролями/resources + event_type.
  - Codex: мінімальний event/text channel footprint, сфокусований на smartlink.redirected.
  - Вердикт: Codex — мінімалістичний, достатній для observability.
- **meta.smartlink.v1**
  - ChatGPT: пакет із event refs доданими до основного пакету.
  - Codex: окремий observability package з власними refs і scope, чітке відмежування core WF_EX_010.
  - Вердикт: Codex — чіткіше визначений пакет observability.

## Загальний вердикт
- Рекомендовано **Codex-candidate** як best-so-far observability layer для SmartLink 4.1.1 (подія smartlink.redirected).
- ChatGPT baseline залишається референсом, але програє за читабельністю/ізоляцією debug.

## Next Steps
- Інтегрувати Codex observability (redirect event) до канонічного SmartLink 4.1.1 поруч із core з WF_EX_010.
- Опційно WF_EX_012: деталізація payload/validation smartlink.redirected або додаткові події (наприклад, errors).***
