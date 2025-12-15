# Governance Pack v1 (for MOVA 4.1.1)

This archive contains a **domain-neutral Governance Pack v1** designed to sit on top of **MOVA 4.1.1**.

## Purpose

- Provide **policy-as-code** (policy profile) to control tools/actions.
- Provide **policy check envelopes** to evaluate planned actions before execution.
- Provide minimal **provenance** records to attach evidence to security/governance episodes.
- Reuse MOVA 4.1.1 security layer for audit logging via `ds.security_event_episode_core_v1`.

## Contents

### Schemas
- `ds.policy_profile_core_v1`
- `ds.tool_call_provenance_core_v1`
- `env.policy_check_request_v1`
- `env.policy_check_response_v1`
- `env.governance_episode_store_v1`

### Examples
- `policy_profile.example.json`
- `policy_check_request.example.json`
- `policy_check_response.example.json`
- `governance_episode_store.example.json`

## Integration notes

- `policy_profile_id` SHOULD align with `global.security_catalog_v1.security_policy_profile[*].id`.
- `recommended_actions[*].action_type` and `actions_taken[*].action_type` SHOULD align with `global.security_catalog_v1.security_action_type[*].id`.
- `security_model_version` is present to support non-breaking evolution.

## Next step in a repo

Copy the `schemas/` files into your MOVA spec or your product repo, then register them in your catalog (if you maintain one).
A helper script is included to patch a `mova4_core_catalog.example.json` style file.
