#!/usr/bin/env node

/**
 * Apply MOVA AI bootstrap pack to generate ready-to-use profile files.
 * Input: ds.mova_ai_bootstrap_pack_v1
 * Output: system_prompt.txt, assistant_guide.md, checklist.txt in out-dir
 */

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--pack") {
      args.pack = argv[++i];
    } else if (arg === "--out-dir") {
      args.outDir = argv[++i];
    }
  }
  return args;
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function loadPack(p) {
  if (!fs.existsSync(p)) die(`[bootstrap-apply] Pack file not found: ${p}`);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    die(`[bootstrap-apply] Invalid JSON: ${err.message}`);
  }
  if (data.mova_version !== "4.0.0") die("[bootstrap-apply] mova_version must be 4.0.0");
  if (!data.pack_id) die("[bootstrap-apply] pack_id is required");
  if (!data.target || !data.target.target_id) die("[bootstrap-apply] target.target_id is required");
  if (!data.instructions || !data.instructions.summary) die("[bootstrap-apply] instructions.summary is required");
  return data;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function renderSystemPrompt(pack) {
  const t = pack.target.target_id;
  const i = pack.instructions || {};
  const lines = [
    `MOVA 4.0.0 Expert System Prompt for ${t}`,
    "---",
    i.summary || "",
    "---",
    i.mova_core || "",
    "---",
    i.mova_layers || "",
    "---",
    i.ai_role || "",
    "---",
    i.json_rules || "",
    "---",
    "Hard constraints:",
    pack.constraints || ""
  ];
  return lines.join("\n");
}

function renderAssistantGuide(pack) {
  const t = pack.target.target_id;
  const i = pack.instructions || {};
  const recipes = pack.workflow_recipes || [];
  const examples = pack.examples || [];
  const parts = [];
  parts.push(`# MOVA Assistant Guide for ${t}`);
  parts.push("");
  parts.push("## Summary");
  parts.push(i.summary || "");
  parts.push("");
  parts.push("## Core concepts (MOVA 4.0.0)");
  parts.push((i.mova_core || "") + (i.mova_layers ? "\n\n" + i.mova_layers : ""));
  if (recipes.length) {
    parts.push("");
    parts.push("## Workflow recipes");
    recipes.forEach((r) => {
      parts.push(`### ${r.name || "Recipe"}`);
      if (r.description) parts.push(r.description);
      if (Array.isArray(r.steps) && r.steps.length) {
        parts.push("");
        r.steps.forEach((s) => parts.push(`- ${s}`));
      }
      if (r.constraints) {
        parts.push("");
        parts.push(`Constraints: ${r.constraints}`);
      }
      parts.push("");
    });
  }
  if (examples.length) {
    parts.push("");
    parts.push("## Examples");
    examples.forEach((ex) => {
      parts.push(`### ${ex.title || "Example"}`);
      parts.push(`User prompt: ${ex.user_prompt || ""}`);
      parts.push(`Model action: ${ex.model_action || ""}`);
      parts.push("");
    });
  }
  return parts.join("\n");
}

function renderChecklist(pack) {
  const t = pack.target.target_id;
  const rules = [];
  const jsonRules = (pack.instructions && pack.instructions.json_rules) || "";
  const constraints = pack.constraints || "";
  const splitIntoItems = (text) =>
    text
      .replace(/\r\n/g, "\n")
      .split(/[\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  rules.push(...splitIntoItems(jsonRules));
  rules.push(...splitIntoItems(constraints));
  const lines = [`MOVA 4.0.0 Checklist for ${t}`, ""];
  rules.forEach((r) => lines.push(`- ${r}`));
  return lines.join("\n");
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, "utf8");
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.pack) die("Usage: node lab/tools/mova_ai_bootstrap_apply_profile.js --pack <path> [--out-dir <dir>]");

  const packPath = path.isAbsolute(args.pack) ? args.pack : path.join(process.cwd(), args.pack);
  const pack = loadPack(packPath);

  const outDir = args.outDir
    ? path.isAbsolute(args.outDir)
      ? args.outDir
      : path.join(process.cwd(), args.outDir)
    : path.join(process.cwd(), "lab", "generated", "bootstrap");
  ensureDir(outDir);

  const targetId = pack.target.target_id;
  const systemPromptPath = path.join(outDir, `${targetId}.system_prompt.txt`);
  const guidePath = path.join(outDir, `${targetId}.assistant_guide.md`);
  const checklistPath = path.join(outDir, `${targetId}.checklist.txt`);

  writeFile(systemPromptPath, renderSystemPrompt(pack));
  writeFile(guidePath, renderAssistantGuide(pack));
  writeFile(checklistPath, renderChecklist(pack));

  console.log(`Generated system_prompt/assistant_guide/checklist for target_id=${targetId} in ${outDir}`);
}

if (require.main === module) {
  main();
}
