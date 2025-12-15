# Layers: red, yellow, green

- **Red (core)** – `core/mova/`:

  - One source of truth about MOVA (schemas, envelopes, global, episodes).

  - Versioned via a manifest and core catalog.

- **Yellow (skills)** – `skills/`:

  - Each skill is a local application of MOVA.

  - It selects a subset of `ds.*` / `env.*`, adds its own ones, and defines scenarios.

- **Green (lab / impl)** – `lab/` and `impl/` folders inside skills:

  - Experiments, prompts, adapters to LLMs, code that can break and move.

  - Red core must stay stable unless explicitly migrated.

