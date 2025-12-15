# SmartLink 4.1.1 — контекст для WF_LAB_SMARTLINK_4_1_1_XX / WF_EX_010

## Purpose
- Довести SmartLink до “best-so-far” під MOVA 4.1.1 без змін червоного ядра 4.0.0 і з явним контролем baseline vs нові кандидати.
- Цей документ описує, де лежать baseline, історичний Codex-кандидат, нові каталоги 4.1.1, а також точки входу (WF-епізоди, snapshotи).

## Versions & Spec References
- Ядро Skills Lab: `core/mova/` — MOVA **4.0.0** (read-only у цій серії).
- Read-only MOVA **4.1.1** spec snapshot: `spec/mova-spec-4.1.1/` (security-layer, operator frame, text-channels, global catalogs — норматив для SmartLink 4.1.1).
- Стартові артефакти серії 4.1.1:
  - Project snapshot: `docs/PROJECT_MEMORY/PROJECT_SNAPSHOT_2025-12-11_smartlink_4_1_1_lab_entry.md`
  - WF-епізод: `docs/PROJECT_MEMORY/WF_LAB_SMARTLINK_4_1_1_01_START.md`

## Experiments Layout (SmartLink)
- `lab/experiments/smartlink_baseline/` — **SmartLink Baseline** (стабільна версія зі старої серії; головний вміст у `mova_smartlink/schemas/` — правила, default envelope, global/meta).
- `lab/experiments/smartlink_codex_candidate/` — **SmartLink Codex Candidate v1** (результат попереднього WF-експерименту; має `config/`, `src/`, `tests/`).
- `lab/experiments/smartlink_4_1_1_candidate_ex010/` — **новий кандидат під MOVA 4.1.1** для WF_EX_010 (структура створена, файли ще не перенесені).
- Базова роль: baseline — read-only референс; старий Codex-candidate — історичний референс; усі нові зміни робимо лише в каталозі 4.1.1 кандидата.

## Plan for 4.1.1 Experiments
- WF_LAB_SMARTLINK_4_1_1_XX — лабораторні епізоди цієї серії.
- Перший domain-experiment: `WF_EX_010_smartlink_4_1_1_baseline_vs_mova` — порівняння baseline проти нового кандидата під MOVA 4.1.1.
- Для кожного WF_EX: є конфіг (`ds.lab_workflow_experiment_config_v1.*`), окремий каталог кандидата в `lab/experiments/`, та результати/епізоди у `lab/` і `docs/PROJECT_MEMORY/`.
- Конфіг WF_EX_010: `lab/examples/ds.lab_workflow_experiment_config_v1.WF_EX_010_smartlink_4_1_1_baseline_vs_mova.json` (опис нижче).
- Кандидат WF_EX_010: `lab/experiments/smartlink_4_1_1_candidate_ex010/`.

## Constraints
- `core/mova/` (MOVA 4.0.0) — не змінюємо.
- `spec/mova-spec-4.1.1/` — read-only, але це “закон” для адаптації SmartLink у серії 4.1.1.
- Baseline `lab/experiments/smartlink_baseline/` — read-only; використовується лише як стабільний референс.
- Історичний Codex-candidate `lab/experiments/smartlink_codex_candidate/` — read-only; зберігаємо для порівнянь.
- Усі нові зміни SmartLink 4.1.1 ведемо тільки в каталозі кандидата `lab/experiments/smartlink_4_1_1_candidate_ex010/`.

## WF_EX_010 Candidate Directory
- Шлях: `lab/experiments/smartlink_4_1_1_candidate_ex010/`.
- Призначення: перший кандидат під MOVA 4.1.1; v2 відносно попереднього Codex-кандидата, але з урахуванням spec 4.1.1.
- Використання: сюди додаються адаптовані schemas/envelopes/worker-код згідно з MOVA 4.1.1; baseline і старий кандидат не змінюються.
- Споріднені посилання:
  - Baseline: `lab/experiments/smartlink_baseline/`
  - Старий кандидат: `lab/experiments/smartlink_codex_candidate/`
  - Spec: `spec/mova-spec-4.1.1/`

## Canonical SmartLink 4.1.1
- Каталог: `lab/experiments/smartlink_4_1_1_canonical/`.
- Складається з: ядра WF_EX_010 (rules/env/global/meta) + observability Codex (redirect event) WF_EX_011.
- Використання: це опорний пакет для прод-інтеграції та наступних WF_EX; каталоги `candidate_ex010` і `candidate_ex011_codex` залишаються історичними.
