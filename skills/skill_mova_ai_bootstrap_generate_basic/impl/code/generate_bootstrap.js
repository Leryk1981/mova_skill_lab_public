#!/usr/bin/env node

/**
 * Generate MOVA AI bootstrap pack from static resource + envelope.
 * Input: env.mova_ai_bootstrap_generate_v1
 * Output: ds.mova_ai_bootstrap_pack_v1 (stdout or --output)
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function buildPack(envelope, resource) {
  const target = envelope.target;
  const now = new Date().toISOString();
  const packId = `${target.target_id || "target"}_${Date.now()}`;

  return {
    mova_version: "4.0.0",
    pack_id: packId,
    target,
    created_at: now,
    instructions: resource.instructions || {},
    workflow_recipes: resource.workflow_recipes || [],
    constraints: resource.constraints || "",
    examples: resource.examples || []
  };
}

function main() {
  const args = process.argv.slice(2);
  let envelopePath = null;
  let outputPath = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--envelope" || arg === "-e") {
      envelopePath = args[++i];
    } else if (arg === "--output" || arg === "-o") {
      outputPath = args[++i];
    }
  }

  if (!envelopePath) {
    console.error("Usage: node generate_bootstrap.js --envelope <path> [--output <path>]");
    process.exit(1);
  }

  const envelopeAbs = path.isAbsolute(envelopePath)
    ? envelopePath
    : path.join(process.cwd(), envelopePath);
  const envelope = loadJson(envelopeAbs);

  const resourcesDir = path.join(__dirname, "..", "resources");
  const resourcePath = path.join(resourcesDir, "mova_ai_bootstrap_instructions_en.json");
  const resource = loadJson(resourcePath);

  const pack = buildPack(envelope, resource);

  const outputJson = JSON.stringify(pack, null, 2);

  if (outputPath) {
    const outputAbs = path.isAbsolute(outputPath)
      ? outputPath
      : path.join(process.cwd(), outputPath);
    fs.writeFileSync(outputAbs, outputJson, "utf8");
  } else {
    process.stdout.write(outputJson + "\n");
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildPack
};
