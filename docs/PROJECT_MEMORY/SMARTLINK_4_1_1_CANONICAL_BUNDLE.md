# SmartLink 4.1.1 — Canonical Bundle

## Що це
- Канонічний пакет SmartLink 4.1.1, зібраний із результатів лабораторії:
  - Ядро (rules/env/global/meta) — best-so-far з WF_EX_010.
  - Observability (redirect event) — Codex-варіант з WF_EX_011.
- Використовується як опорний набір артефактів для прод-репозиторію SmartLink і наступних WF_EX_01x.

## Canonical файли
- Rules: `lab/experiments/smartlink_4_1_1_canonical/schemas/ds.smartlink_rules_v1.schema.json`
- Default envelope: `lab/experiments/smartlink_4_1_1_canonical/envelopes/env.smartlink_default_v1.json`
- Redirect event schema: `lab/experiments/smartlink_4_1_1_canonical/schemas/ds.smartlink_redirect_event_v1.schema.json`
- Redirect event envelope: `lab/experiments/smartlink_4_1_1_canonical/envelopes/env.smartlink_redirect_event_v1.json`
- Global: `lab/experiments/smartlink_4_1_1_canonical/schemas/global.smartlink_v1.json`
- Meta: `lab/experiments/smartlink_4_1_1_canonical/schemas/meta.smartlink_v1.json`
- Examples: `lab/experiments/smartlink_4_1_1_canonical/examples/`

## Як ми сюди прийшли
- WF_EX_010: узгодили ядро SmartLink (rules/env/global/meta) під MOVA 4.1.1 → best-so-far у `candidate_ex010`.
- WF_EX_011: порівняли observability варіанти; Codex-варіант redirect event став best-so-far → `candidate_ex011_codex`.
- Canonical bundle об'єднав ядро WF_EX_010 + observability Codex WF_EX_011 в одному каталозі.

## Посилання на епізоди
- WF_EX_010 result: `docs/PROJECT_MEMORY/WF_EX_010_smartlink_4_1_1_result.md`
- WF_EX_011 result: `docs/PROJECT_MEMORY/WF_EX_011_smartlink_4_1_1_result.md`
- Observability context: `docs/lab_workflow_smartlink_4_1_1_observability_context.md`

## Призначення
- Використовуйте canonical каталог як базу для:
  - подальших WF_EX (01x+) щодо SmartLink,
  - перенесення в прод-репозиторій SmartLink,
  - референс для нових event/observability експериментів.

Out of scope: worker/src/config/tests/deploy — залишаються зовнішніми до пакету.
