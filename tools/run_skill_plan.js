#!/usr/bin/env node

// Skill run planner for MOVA Skills Lab.
// Reads a ds.skill_run_request_v1 JSON file, looks into the skill registry,
// manifest and episode_policy, and prints a plan (no real execution).

const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node tools/run_skill_plan.js --request-file <path/to/request.json>",
      "",
      "Example:",
      "  node tools/run_skill_plan.js \\",
      "    --request-file lab/skill_runs/context7_ajv_run_request_01.json"
    ].join("\n")
  );
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--request-file") {
      args.requestFile = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }
  return args;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!args.requestFile) {
    console.error("[run_skill_plan] Missing --request-file");
    printUsage();
    process.exit(1);
  }

  const rootDir = path.join(__dirname, "..");

  const requestPath = path.isAbsolute(args.requestFile)
    ? args.requestFile
    : path.join(rootDir, args.requestFile);

  if (!fs.existsSync(requestPath)) {
    console.error("[run_skill_plan] Request file not found:", requestPath);
    process.exit(1);
  }

  // 1. Load and validate ds.skill_run_request_v1
  const requestSchemaPath = path.join(
    rootDir,
    "core",
    "mova",
    "ds",
    "ds.skill_run_request_v1.schema.json"
  );

  const requestSchema = loadJson(requestSchemaPath);

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);

  const validateRequest = ajv.compile(requestSchema);

  const request = loadJson(requestPath);

  if (!validateRequest(request)) {
    console.error("[run_skill_plan] Request is not valid against ds.skill_run_request_v1:");
    console.error(JSON.stringify(validateRequest.errors, null, 2));
    process.exit(1);
  }

  const runId = request.run_id;
  const skillId = request.skill_id;

  // 2. Load skill registry
  const registryPath = path.join(rootDir, "lab", "skills_registry_v1.json");

  if (!fs.existsSync(registryPath)) {
    console.error("[run_skill_plan] Skill registry not found:", registryPath);
    process.exit(1);
  }

  const registry = loadJson(registryPath);

  const skills = registry.skills || registry.entries || [];

  const skillEntry = skills.find((s) => s.skill_id === skillId);

  if (!skillEntry) {
    console.error(`[run_skill_plan] Skill not found in registry: ${skillId}`);
    process.exit(1);
  }

  // 3. Load manifest and episode_policy
  const manifestPath = path.isAbsolute(skillEntry.manifest_path)
    ? skillEntry.manifest_path
    : path.join(rootDir, skillEntry.manifest_path);

  if (!fs.existsSync(manifestPath)) {
    console.error("[run_skill_plan] Manifest not found:", manifestPath);
    process.exit(1);
  }

  const manifest = loadJson(manifestPath);
  const episodePolicy = manifest.episode_policy || { mode: "none" };

  // 4. Select binding
  const bindings = skillEntry.bindings || [];

  let selectedBinding = null;
  let bindingReason = "none";

  if (request.binding_id) {
    selectedBinding = bindings.find((b) => b.binding_id === request.binding_id) || null;
    bindingReason = selectedBinding ? "by_request_id" : "requested_id_not_found";
  } else if (bindings.length === 1) {
    selectedBinding = bindings[0];
    bindingReason = "single_binding_auto_selected";
  } else if (bindings.length > 1) {
    bindingReason = "multiple_bindings_no_explicit_choice";
  } else {
    bindingReason = "no_bindings_in_registry";
  }

  // 5. Resolve episode recording mode
  const policyMode = episodePolicy.mode || "none";

  const respectPolicy =
    typeof request.respect_episode_policy === "boolean"
      ? request.respect_episode_policy
      : true;

  const overrideMode = request.force_episode_mode || null;

  let effectiveMode = "none";

  if (overrideMode) {
    effectiveMode = overrideMode;
  } else if (respectPolicy) {
    effectiveMode = policyMode;
  } else {
    effectiveMode = "none";
  }

  let recordingType = "never";

  if (effectiveMode === "full") {
    recordingType = "always";
  } else if (effectiveMode === "none") {
    recordingType = "never";
  } else {
    recordingType = "conditional";
  }

  const plan = {
    action: "plan_skill_run",
    run_id: runId,
    skill_id: skillId,
    binding: selectedBinding
      ? {
          binding_id: selectedBinding.binding_id,
          runtime_type: selectedBinding.runtime_type,
          binding_path: selectedBinding.binding_path
        }
      : null,
    binding_reason: bindingReason,
    episode: {
      policy: episodePolicy,
      request: {
        respect_episode_policy: respectPolicy,
        force_episode_mode: overrideMode
      },
      effective_mode: effectiveMode,
      recording_type: recordingType
    }
  };

  console.log(JSON.stringify(plan, null, 2));
}

if (require.main === module) {
  main();
}

