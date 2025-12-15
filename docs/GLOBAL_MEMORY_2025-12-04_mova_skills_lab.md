# Global Memory: MOVA Skills Lab (2025-12-04)

- **MOVA Skills Lab** — contract-first skills laboratory built on MOVA 4.0.0 framework, organized in three layers: red (core contracts), yellow (skills), green (lab tools/experiments)

- **Red core** (`core/mova/`) — shared MOVA schemas (ds.*), envelopes (env.*), global vocabulary (roles, resources, states, verbs). No executable code, only contract definitions.

- **Yellow layer** (`skills/`) — 10 skills defined, each with manifest, local schemas, prompt profiles, runtime bindings, cases, and episodes. Skills are stateless and composable.

- **Key infrastructure skills**: `repo_snapshot_basic`, `skill_scaffolder_basic`, `connector_scaffolder_basic`, `runtime_binding_code_scaffolder_basic`, `code_exec_task_basic`, `repo_code_change_plan_basic` — form a complete scaffolding and execution pipeline.

- **Connector workflow**: Connectors are created via `context7_docs` + `skill_scaffolder_basic` pair, not directly. This ensures API documentation is captured and scaffolds follow MOVA patterns.

- **Call-envelope primitive** (`env.call_run_v1`) — second-order speech act for invoking other envelopes, enabling meta-skills and orchestration scenarios.

- **Episode policy** — each skill defines when episodes are recorded (`none`, `on_error`, `sampled`, `full`) via `episode_policy` in manifest.

- **Validation**: `npm run validate` validates all schemas, manifests, registry, bindings, and cases using Ajv with draft-2020-12 support.

- **Current focus**: Infrastructure skills complete. Next: scenario definition format, skill runner implementation, more connector skills, orchestration examples.

