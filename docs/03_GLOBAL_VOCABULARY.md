# Global vocabulary (draft)

The global vocabulary is defined under `core/mova/global/` and provides:

- **Roles** – who acts (human, agent, worker, tool, registry, etc.).

- **Resources** – what is being acted upon (file, note, episode, dataset, etc.).

- **States** – lifecycle states (draft, planned, executed, failed, archived, etc.).

In this bootstrap task we only create placeholders. Real vocabularies

will be defined in later tasks, based on the MOVA 4.0.0 core catalog.

## Current global vocabulary in the lab

The red core defines the following shared vocabularies under `core/mova/global/`:

- `roles.json`:

  - `human` – human user interacting with the lab or skills.

  - `agent` – LLM-based agent orchestrating skills and envelopes.

  - `tool` – external tool or service.

  - `worker` – background worker or script.

  - `registry` – catalog / registry service.

- `resources.json`:

  - `skill` – a MOVA skill in this lab.

  - `procedure` – a structured procedure with ordered steps.

  - `episode` – an execution record of an envelope.

  - `envelope` – a MOVA envelope definition or instance.

  - `catalog` – a MOVA catalog (core or skills).

  - `file` – a file or blob.

  - `note` – a note or document.

- `states.json`:

  - `draft`, `planned`, `running`, `succeeded`,

  - `failed`, `cancelled`, `archived`.

- `verbs.json`:

  - Core verbs: `create`, `update`, `publish`, `record`, `route`.

  - Lab verbs: `transform` (used by `skill.mova_template`),

    `scan` (reserved for future file-related skills),

    `run` – керує запуском скіла через контрольну площину (control plane).

Skills in this lab are expected to reuse these vocabularies where possible.

If a skill introduces new roles, resources, states or verbs, it should

document them clearly and keep them consistent with the global ones.

