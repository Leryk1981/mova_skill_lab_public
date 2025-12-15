#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const ROOT = path.join(__dirname, "..");

function readJson(relPath) {
  const fullPath = path.join(ROOT, relPath);
  const data = fs.readFileSync(fullPath, "utf8");
  try {
    return JSON.parse(data);
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${relPath}\n${e.message}`);
  }
}

function listJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".json"))
    .map((d) => path.join(dirPath, d.name));
}

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);

let errorCount = 0;

function reportErrors(label, validateFn, data) {
  const valid = validateFn(data);
  if (!valid) {
    console.error(`❌ ${label} is INVALID`);
    for (const err of validateFn.errors || []) {
      console.error(
        `  - ${err.instancePath || "/"} ${err.message} ${
          err.params ? JSON.stringify(err.params) : ""
        }`
      );
    }
    errorCount += 1;
  } else {
    console.log(`✅ ${label} is valid`);
  }
}

// Load core schemas
const episodeSchema = readJson("core/mova/ds/ds.episode_v1.schema.json");
const episodePolicySchema = readJson(
  "core/mova/ds/ds.episode_policy_v1.schema.json"
);
const skillDescriptorSchema = readJson(
  "core/mova/ds/ds.skill_descriptor_v1.schema.json"
);
const runtimeBindingSchema = readJson(
  "core/mova/ds/ds.skill_runtime_binding_v1.schema.json"
);
const skillRegistrySchema = readJson(
  "core/mova/ds/ds.skill_registry_v1.schema.json"
);

// Register schemas with Ajv so $ref can resolve them
ajv.addSchema(episodePolicySchema);

// Ajv2020 properly supports draft-2020-12 schemas with $schema field
const validateEpisode = ajv.compile(episodeSchema);
const validateSkillDescriptor = ajv.compile(skillDescriptorSchema);
const validateRuntimeBinding = ajv.compile(runtimeBindingSchema);
const validateSkillRegistry = ajv.compile(skillRegistrySchema);

// 1) Validate skills registry
let registry;
try {
  registry = readJson("lab/skills_registry_v1.json");
  reportErrors("lab/skills_registry_v1.json", validateSkillRegistry, registry);
} catch (e) {
  console.error(`❌ Failed to read/validate skills registry: ${e.message}`);
  process.exit(1);
}

// 2) For each skill in registry: validate manifest and bindings
for (const skill of registry.skills || []) {
  const manifestRel = skill.manifest_path;
  const manifestLabel = `manifest for ${skill.skill_id} (${manifestRel})`;

  try {
    const manifest = readJson(manifestRel);
    reportErrors(manifestLabel, validateSkillDescriptor, manifest);
  } catch (e) {
    console.error(`❌ Failed to read ${manifestLabel}: ${e.message}`);
    errorCount += 1;
    continue;
  }

  // Validate bindings, if any
  if (Array.isArray(skill.bindings)) {
    for (const b of skill.bindings) {
      const bindingRel = b.binding_path;
      const bindingLabel = `binding ${b.binding_id} for ${skill.skill_id} (${bindingRel})`;

      try {
        const binding = readJson(bindingRel);
        reportErrors(bindingLabel, validateRuntimeBinding, binding);
      } catch (e) {
        console.error(`❌ Failed to read ${bindingLabel}: ${e.message}`);
        errorCount += 1;
      }
    }
  }

  // 3) Validate episodes for this skill
  const manifestFullPath = path.join(ROOT, manifestRel);
  const skillDir = path.dirname(manifestFullPath); // e.g. skills/mova_template
  const episodesDir = path.join(skillDir, "episodes");
  const episodeFiles = listJsonFiles(episodesDir);

  for (const epFullPath of episodeFiles) {
    const relPath = path.relative(ROOT, epFullPath);
    const label = `episode ${relPath}`;
    try {
      const ep = JSON.parse(fs.readFileSync(epFullPath, "utf8"));
      reportErrors(label, validateEpisode, ep);
    } catch (e) {
      console.error(`❌ Failed to read ${label}: ${e.message}`);
      errorCount += 1;
    }
  }
}

if (errorCount === 0) {
  console.log("\n✅ All checked documents are valid.");
  process.exit(0);
} else {
  console.error(`\n❌ Validation finished with ${errorCount} error(s).`);
  process.exit(1);
}

