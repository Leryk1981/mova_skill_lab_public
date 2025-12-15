# WF_EX_011 SmartLink 4.1.1 Observability — план (каркас)

## Scope
- ✅ `ds.smartlink.redirect_event.v1`
- ✅ `env.smartlink.redirect_event.v1`
- ✅ Доповнення до `global.smartlink.v1` (text channel smartlink.redirected / event catalog за потреби)
- ✅ Доповнення до `meta.smartlink.v1` (observability/events)
- 🚫 out of scope: rules/env.default логіка, worker/src/config/tests/deploy, інші події

## ChatGPT baseline (що реалізуємо зараз)
- Подія `ds.smartlink.redirect_event.v1` (A–F): ідентифікація події, лінку/правила/цілі, URL, клієнт/geo/lang, UTM/referrer, optional debug (matched/skipped/score/raw_context з приміткою про sensitive).
- Envelope `env.smartlink.redirect_event.v1`: mova_version 4.1.1, inputs (request_context + decision), output redirect_event, text_channel → smartlink.redirected, без worker/transport деталей.
- Доповнення до global/meta: text channel smartlink.redirected, event ref у meta, scope/out-of-scope зафіксовані.

## Codex candidate
- Альтернативний дизайн у `lab/experiments/smartlink_4_1_1_candidate_ex011_codex/`: компактний core+debug, контекст/decision зведені, без транспорту; окремі ds/env/global/meta для observability.

## Посилання
- Context: `docs/lab_workflow_smartlink_4_1_1_observability_context.md`
- Config: `lab/examples/ds.lab_workflow_experiment_config_v1.WF_EX_011_smartlink_4_1_1_observability.json`
- Plan stub (JSON): `lab/examples/ds.lab_workflow_episode_data_v1.WF_EX_011_smartlink_4_1_1_plan_stub.json`

## Next Steps
- Планування WF_EX_011 для двох варіантів (ChatGPT baseline vs Codex candidate), отримати plan_result.
- Застосувати Codex-candidate, потім run baseline vs codex, зафіксувати вердикт.***
