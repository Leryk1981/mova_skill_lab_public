# DECISIONS_DPP_LAB

Decision log for the DPP lab in `mova_skills_lab`.  
This file records important architectural decisions, especially when we **intentionally defer** implementation of changes suggested by tools like `mova_check_basic`.

## Format

Each decision has:
- `id` — stable decision identifier.
- `date` — ISO date of the decision.
- `status` — e.g. `accepted`, `deferred`, `rejected`.
- `scope` — what part of the lab it affects (schemas, envelopes, skills, runtime).
- `summary` — one-line description.
- `details` — short explanation.
- `trigger` — what triggered the decision (episode / skill / check).
- `related_files` — key files (schemas, examples, episodes).
- `target_phase` — when we plan to revisit it (if deferred).

---

## DPP-LAB-DEC-0001 — Cobalt-only materials model in extended passport

- **id:** DPP-LAB-DEC-0001  
- **date:** 2025-12-08  
- **status:** deferred  
- **scope:** schemas (lab DPP), `ds.lab_battery_passport_extended_v1`  
- **summary:** Keep extended passport focused on cobalt-only materials for now, defer multi-material modelling.  
- **details:**  
  For the first DPP lab phase we intentionally model only cobalt in `ds.lab_battery_passport_extended_v1`. This keeps the schema and examples focused on one critical raw material while we validate the overall pipeline (regulation → schema → passport → mova_check → episodes → snapshots).  
  We accept the `mova_check_basic` warning that other critical materials (e.g. lithium, nickel) are not yet covered, but we **explicitly defer** this extension to a later phase.
- **trigger:**  
  - `skills/mova_check_basic/episodes/episode_2025-12-08_dpp_lab_L1_06_battery_passport_extended.json`
- **related_files:**  
  - `lab/schemas/ds.lab_battery_passport_extended_v1.schema.json`  
  - `lab/examples/dpp_battery_passport_extended_example.json`
- **target_phase:** L2_materials_extension (future lab phase to add multi-material support).

---

## DPP-LAB-DEC-0002 — external_sources optional in extended passport

- **id:** DPP-LAB-DEC-0002  
- **date:** 2025-12-08  
- **status:** deferred  
- **scope:** schemas (lab DPP), `ds.lab_battery_passport_extended_v1`  
- **summary:** Keep `external_sources` optional in the extended passport during early lab phases, plan to tighten later.  
- **details:**  
  The extended passport already supports `external_sources` (ERP/MES references) via `ds.lab_external_source_ref_v1`, but the field is still optional. `mova_check_basic` recommends making it required with `minItems = 1` to guarantee at least one data lineage reference per passport. We **accept** this as a desirable direction, but defer the change until we have more stable real-world integration patterns and examples.
- **trigger:**  
  - `skills/mova_check_basic/episodes/episode_2025-12-08_dpp_lab_L1_06_battery_passport_extended.json`
- **related_files:**  
  - `lab/schemas/ds.lab_battery_passport_extended_v1.schema.json`  
  - `lab/schemas/ds.lab_external_source_ref_v1.schema.json`  
  - `lab/examples/dpp_battery_passport_extended_example.json`
- **target_phase:** L1x_external_sources_required (future lab step to enforce `external_sources` with `minItems = 1`).
