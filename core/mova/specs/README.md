# core/mova/specs – external MOVA specs

This folder is a parking place for raw MOVA 4.0.0 spec files

(schemas, examples, docs) imported from outside.

The lab core manifest (`00_MANIFEST.json`) points to the

MOVA 4.0.0 core catalog schema. In later tasks, this folder

can contain:

- `schemas/ds.mova4_core_catalog_v1.schema.json`

- `schemas/env.mova4_core_catalog_publish_v1.schema.json`

- examples for these schemas

- textual specs mirrored from upstream.

At bootstrap we only keep this README.

## MOVA 4.0.0 core catalog (imported)

Schemas:

- `schemas/ds.mova4_core_catalog_v1.schema.json`

- `schemas/env.mova4_core_catalog_publish_v1.schema.json`

Examples:

- `examples/mova4_core_catalog.example.json`

- `examples/env.mova4_core_catalog_publish_v1.example.json`

The core manifest (`core/mova/00_MANIFEST.json`) points to the catalog schema

and publish envelope. These files are treated as upstream specs; we do not

modify them in this lab, only reference and build on top of them.

