# Schema spec (ds.*) – draft

Schemas (`ds.*`) describe data structures used by envelopes and episodes.

- MOVA 4.0.0 introduces a core catalog schema:

  - `ds.mova4_core_catalog_v1.schema.json`

  - It lists data types, verbs, envelopes and episode types in one document.

In this bootstrap we only connect the lab to that core catalog.

Concrete domain schemas (files, notes, smartlink, etc.) will be added

as separate `ds.*` files either in the core or inside skills.

