#!/usr/bin/env node
/**
 * apply_governance_pack_v1_to_core_catalog.mjs
 *
 * Patches a mova4_core_catalog-like JSON file by appending Governance Pack v1 artifacts
 * (2 data_types + 3 envelopes). It will not duplicate entries by id.
 *
 * Usage:
 *   node scripts/apply_governance_pack_v1_to_core_catalog.mjs path/to/mova4_core_catalog.example.json
 */
import fs from "node:fs";

const catalogPath = process.argv[2];
if (!catalogPath) {
  console.error("Usage: node scripts/apply_governance_pack_v1_to_core_catalog.mjs <catalog.json>");
  process.exit(2);
}

const raw = fs.readFileSync(catalogPath, "utf-8");
const catalog = JSON.parse(raw);

catalog.data_types = Array.isArray(catalog.data_types) ? catalog.data_types : [];
catalog.envelopes = Array.isArray(catalog.envelopes) ? catalog.envelopes : [];

const dataTypesToAdd = [
  {
    id: "ds.policy_profile_core_v1",
    title: "Governance policy profile",
    description: "Policy-as-code profile for allow/deny, confirmations, limits, scope.",
    schema_ref: "https://mova.dev/schemas/ds.policy_profile_core_v1.schema.json",
  },
  {
    id: "ds.tool_call_provenance_core_v1",
    title: "Tool call provenance",
    description: "Minimal provenance record for tool invocations (evidence).",
    schema_ref: "https://mova.dev/schemas/ds.tool_call_provenance_core_v1.schema.json",
  },
];

const envelopesToAdd = [
  {
    id: "env.policy_check_request_v1",
    title: "Policy check request",
    description: "Validate candidate tool/actions against a policy profile before execution.",
    schema_ref: "https://mova.dev/schemas/env.policy_check_request_v1.schema.json",
  },
  {
    id: "env.policy_check_response_v1",
    title: "Policy check response",
    description: "Policy evaluation result for candidate actions.",
    schema_ref: "https://mova.dev/schemas/env.policy_check_response_v1.schema.json",
  },
  {
    id: "env.governance_episode_store_v1",
    title: "Governance episode store",
    description: "Store governance/security episodes (security_event_episode_core_v1).",
    schema_ref: "https://mova.dev/schemas/env.governance_episode_store_v1.schema.json",
  },
];

function upsertById(arr, item) {
  if (!arr.some((x) => x && x.id === item.id)) arr.push(item);
}

for (const dt of dataTypesToAdd) upsertById(catalog.data_types, dt);
for (const env of envelopesToAdd) upsertById(catalog.envelopes, env);

// Optional: bump catalog version if it looks like a draft
if (typeof catalog.version === "string" && catalog.version.includes("4.1.0")) {
  catalog.version = "4.1.1-core";
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
console.log("Patched:", catalogPath);
