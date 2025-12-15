# DPP-L2_03: Manufacturer ↔ Verifier Mini-Workflow

Minimal lab workflow using existing DPP envelopes.

- **Step 1:** Manufacturer reads internal view of the battery passport via `env.dpp_passport_read_v1` (view_level = `manufacturer`).
- **Step 2:** Manufacturer triggers export via `env.dpp_export_v1` (target_format = `gs1_epcis`).
- **Step 3:** Verifier reads the passport via `env.dpp_passport_read_v1` (view_level = `verifier`).

Concrete envelope instances:
- `lab/examples/env.dpp_passport_read_v1.dpp_lab.manufacturer_view_example.json`
- `lab/examples/env.dpp_export_v1.dpp_lab.gs1_epcis_example.json`
- `lab/examples/env.dpp_passport_read_v1.dpp_lab.verifier_view_example.json`

This document describes the lab-level workflow; execution is handled by external services.
