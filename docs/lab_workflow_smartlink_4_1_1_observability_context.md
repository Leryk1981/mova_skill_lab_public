# SmartLink 4.1.1 Observability — контекст WF_EX_011

## Навіщо
- WF_EX_010 закрив основу SmartLink 4.1.1 (rules/env/global/meta). Потрібно покрити спостережуваність: стандартна подія `smartlink.redirected` + envelope її формування.
- WF_EX_011 фокусується лише на: `ds.smartlink.redirect_event.v1`, `env.smartlink.redirect_event.v1`, доповненнях до `global.smartlink.v1` і `meta.smartlink.v1`.
- Буде дві гіпотези: **ChatGPT baseline** (реалізуємо зараз) і **Codex candidate** (у наступному таску).

## Посилання на попередній етап
- WF_EX_010 apply/result: `docs/PROJECT_MEMORY/WF_EX_010_smartlink_4_1_1_apply.md`, `docs/PROJECT_MEMORY/WF_EX_010_smartlink_4_1_1_result.md`
- Кандидат 4.1.1 (правила/env/global/meta): `lab/experiments/smartlink_4_1_1_candidate_ex010/`

## Scope WF_EX_011 (observability only)
- ✅ `ds.smartlink.redirect_event.v1`
- ✅ `env.smartlink.redirect_event.v1`
- ✅ Доповнення до `global.smartlink.v1` (text channel smartlink.redirected, event catalog за потреби)
- ✅ Доповнення до `meta.smartlink.v1` (observability/events розділ)
- 🚫 поза scope: rules/env.default логіка, worker/src/config/tests/deploy, інші доменні події

## ChatGPT baseline (структура події)
- **A. Ідентифікація події**: `event_id`, `event_type`="smartlink.redirected", `occurred_at` (date-time), `trace_id?`, `correlation_id?`.
- **B. SmartLink/правило**: `link_id`, `rule_id?`, `target_id?`, `decision_source` enum (`rules|fallback|error`).
- **C. URL**: `original_url`, `resolved_url`, `fallback_used`, `http_status?`.
- **D. Клієнт**: `client_id?`, `session_id?`, `device` (type/os/browser), `geo` (country/region/city), `lang`.
- **E. Маркетинг/referrer**: `referrer_url?`, `utm` (source/medium/campaign/term?/content?).
- **F. Debug (optional)**: `matched_rules[]`, `skipped_rules[]?`, `score_details?`, `raw_context?` (sensitive/no PII by default).

## ChatGPT baseline (envelope)
- `env.smartlink.redirect_event.v1`: mova_version 4.1.1; inputs: `request_context`, `decision`; outputs: `redirect_event` (ds.smartlink.redirect_event.v1); text_channel → smartlink.redirected; опис: формує подію redirect і відправляє в канал (без worker/transport деталей).

## Codex candidate
- Placeholder: буде сформовано в окремому таску як альтернативний дизайн події/енвелопу.
