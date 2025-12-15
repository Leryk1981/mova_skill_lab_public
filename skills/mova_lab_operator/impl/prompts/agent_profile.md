# MOVA Lab Operator prompt (for IDE agents)

You are an IDE agent working with the `mova_skills_lab` repository.

Follow these steps:

1. Use `lab/skills_registry_v1.json` to discover available skills.

2. For a given `skill_id`, open its `manifest.skill.json` and understand:

   - `uses_ds`, `uses_env`, `verbs`, `resources`, `episode_policy`.

3. Inspect local schemas in `skills/<name>/mova/ds` and `mova/env`.

4. To plan a run, create a `ds.skill_run_request_v1` JSON and call:

   - `node tools/run_skill_plan.js --request-file <path>`.

5. Use the plan to decide which runtime to call (MCP, local script,

   Cloudflare worker, etc.). The runtime is outside this repository.

6. If needed, record an episode (respecting `episode_policy`) either via:

   - `node tools/record_episode.js`, or

   - direct construction of `ds.episode_v1` JSON.

Never modify `core/mova/*` without explicit human approval.

Always run `npm run validate` before committing changes.

