#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const catalogPath = path.join(repoRoot, "docs", "lab", "skills_catalog.json");

function loadCatalog() {
  const raw = fs.readFileSync(catalogPath, "utf8");
  const items = JSON.parse(raw);
  const map = new Map();
  for (const entry of items) {
    if (entry && entry.id) {
      map.set(entry.id, entry);
    }
  }
  return { items, map };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token) continue;
    if (token === "--case") args.case = argv[++i];
    else if (token === "--env") args.env = argv[++i];
    else if (token === "--skill") args.skill = argv[++i];
    else if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--list") args.list = true;
    else {
      (args._unknown ||= []).push(token);
    }
  }
  return args;
}

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function relToRepo(absPath) {
  const rel = path.relative(repoRoot, absPath);
  return toPosix(rel);
}

function resolveAndCheck(inputPath, label) {
  if (!inputPath) return null;
  const abs = path.isAbsolute(inputPath) ? inputPath : path.join(repoRoot, inputPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`${label} does not exist: ${inputPath}`);
  }
  return { abs: path.resolve(abs), rel: relToRepo(path.resolve(abs)) };
}

function findSkillForCase(catalogItems, rel) {
  for (const entry of catalogItems) {
    if (!entry?.case_dirs?.length) continue;
    for (const dir of entry.case_dirs) {
      if (!dir) continue;
      const normalized = dir.endsWith("/") ? dir : `${dir}`;
      const dirPosix = normalized.replace(/\\/g, "/");
      if (rel === dirPosix || rel.startsWith(`${dirPosix}/`)) {
        return entry;
      }
    }
  }
  return null;
}

function findSkillForEnv(catalogItems, rel) {
  for (const entry of catalogItems) {
    if (!entry?.env_prefixes?.length) continue;
    for (const prefix of entry.env_prefixes) {
      if (!prefix) continue;
      const prefixPosix = prefix.replace(/\\/g, "/");
      if (rel === prefixPosix || rel.startsWith(`${prefixPosix}`)) {
        return entry;
      }
    }
  }
  return null;
}

function showHelp(catalogItems) {
  const sample = [
    "Usage:",
    "  npm run lab:run -- --case skills/<skill_dir>/cases/<case>.json",
    "  npm run lab:run -- --env lab/examples/<env>.json",
    "  npm run lab:run -- --skill <skill_id> --case <path> (to disambiguate)",
    "",
    "Available skills:"
  ];
  for (const entry of catalogItems) {
    sample.push(`  - ${entry.id}`);
  }
  sample.push("");
  console.log(sample.join("\n"));
}

function expandArgs(list, context) {
  if (!Array.isArray(list)) return [];
  return list.map((token) => {
    if (typeof token !== "string") return token;
    return token
      .replace(/\{case_abs\}/g, context.caseAbs || "")
      .replace(/\{case_rel\}/g, context.caseRel || "")
      .replace(/\{env_abs\}/g, context.envAbs || "")
      .replace(/\{env_rel\}/g, context.envRel || "")
      .replace(/\{skill_id\}/g, context.skillId || "")
      .replace(/\{repo_root\}/g, repoRoot);
  });
}

function formatInstruction(text, context) {
  if (!text) return "";
  return text
    .replace(/\{case_abs\}/g, context.caseAbs || "(n/a)")
    .replace(/\{case_rel\}/g, context.caseRel || "(n/a)")
    .replace(/\{env_abs\}/g, context.envAbs || "(n/a)")
    .replace(/\{env_rel\}/g, context.envRel || "(n/a)")
    .replace(/\{skill_id\}/g, context.skillId || "(n/a)");
}

function ensureSupported(runner, inputKind) {
  if (!inputKind) return;
  const supported = runner?.supported_inputs;
  if (Array.isArray(supported) && supported.length) {
    if (!supported.includes(inputKind)) {
      throw new Error(`Skill runner does not support --${inputKind} inputs.`);
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const { items: catalogItems, map: catalogMap } = loadCatalog();

  if (args.help) {
    showHelp(catalogItems);
    return;
  }
  if (args.list) {
    showHelp(catalogItems);
    return;
  }

  const caseInput = resolveAndCheck(args.case, "--case path");
  const envInput = resolveAndCheck(args.env, "--env path");

  let skillEntry = null;
  if (caseInput) {
    skillEntry = findSkillForCase(catalogItems, caseInput.rel);
    if (!skillEntry) {
      throw new Error(`Unable to map case to a skill (path: ${caseInput.rel}).`);
    }
  }
  if (envInput) {
    const envSkill = findSkillForEnv(catalogItems, envInput.rel);
    if (!envSkill) {
      throw new Error(`Unable to map env to a skill (path: ${envInput.rel}).`);
    }
    if (skillEntry && envSkill.id !== skillEntry.id) {
      throw new Error(`--case maps to ${skillEntry.id} but --env maps to ${envSkill.id}. Use --skill to disambiguate.`);
    }
    skillEntry = envSkill;
  }

  if (args.skill) {
    const explicit = catalogMap.get(args.skill);
    if (!explicit) {
      throw new Error(`Unknown skill id: ${args.skill}`);
    }
    if (skillEntry && skillEntry.id !== explicit.id) {
      throw new Error(`Skill inferred from inputs (${skillEntry.id}) does not match --skill ${explicit.id}.`);
    }
    skillEntry = explicit;
  }

  if (!skillEntry) {
    throw new Error("Provide --case or --env (and optionally --skill) so the runner can identify a skill.");
  }

  if (!caseInput && !envInput) {
    throw new Error("Provide --case or --env so the skill runner has input data.");
  }

  const runner = skillEntry.runner;
  if (!runner) {
    throw new Error(`Skill ${skillEntry.id} does not define runner metadata.`);
  }

  if (caseInput) ensureSupported(runner, "case");
  if (envInput) ensureSupported(runner, "env");

  const context = {
    caseAbs: caseInput?.abs || "",
    caseRel: caseInput?.rel || "",
    envAbs: envInput?.abs || "",
    envRel: envInput?.rel || "",
    skillId: skillEntry.id
  };

  console.log(`[lab:run] RUN ${skillEntry.id}`);
  if (caseInput) console.log(`  case: ${caseInput.rel}`);
  if (envInput) console.log(`  env: ${envInput.rel}`);
  if (skillEntry.source_dir) console.log(`  source: ${skillEntry.source_dir}`);

  if (runner.mode === "node") {
    const command = runner.command || "node";
    const scriptArg = runner.script ? path.join(repoRoot, runner.script) : null;
    if (scriptArg && !fs.existsSync(scriptArg)) {
      throw new Error(`Runner script not found: ${runner.script}`);
    }
    const argsList = [];
    if (scriptArg) {
      argsList.push(scriptArg);
    }
    argsList.push(...expandArgs(runner.args?.base || [], context));
    if (caseInput && runner.args?.case) {
      argsList.push(...expandArgs(runner.args.case, context));
    }
    if (envInput && runner.args?.env) {
      argsList.push(...expandArgs(runner.args.env, context));
    }

    console.log(`  command: ${command} ${argsList.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}`);
    const res = spawnSync(command, argsList, {
      cwd: repoRoot,
      shell: false,
      encoding: "utf8"
    });
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
    if (res.status === 0) {
      console.log(`[lab:run] PASS ${skillEntry.id}`);
      process.exitCode = 0;
    } else {
      console.error(`[lab:run] FAIL ${skillEntry.id} (exit ${res.status})`);
      process.exitCode = res.status || 1;
    }
    return;
  }

  if (runner.mode === "manual") {
    console.log("  mode: manual dispatch");
    if (runner.binding_path) console.log(`  binding: ${runner.binding_path}`);
    if (runner.profile_path) console.log(`  profile: ${runner.profile_path}`);
    const instructions = runner.instructions || [];
    if (instructions.length) {
      console.log("  instructions:");
      instructions.forEach((line, idx) => {
        console.log(`    ${idx + 1}. ${formatInstruction(line, context)}`);
      });
    }
    console.log(`[lab:run] PASS (manual) ${skillEntry.id}`);
    process.exitCode = 0;
    return;
  }

  throw new Error(`Unknown runner mode for ${skillEntry.id}: ${runner.mode}`);
}

try {
  main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[lab:run] ERROR ${message}`);
  process.exitCode = 1;
}
