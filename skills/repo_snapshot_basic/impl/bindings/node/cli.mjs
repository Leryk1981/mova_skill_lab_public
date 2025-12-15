#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..", "..", "..");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token) continue;
    if (token === "--env") args.env = argv[++i];
    else if (token === "--out") args.out = argv[++i];
    else if (token === "--help" || token === "-h") args.help = true;
  }
  return args;
}

function formatStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
    date.getHours()
  )}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runGit(args) {
  const res = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
  if (res.status !== 0) return null;
  return res.stdout.trim();
}

function listTopLevel() {
  const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
  return entries
    .filter((e) => !e.name.startsWith("."))
    .map((entry) => {
      const fullPath = path.join(repoRoot, entry.name);
      const stats = fs.statSync(fullPath);
      return {
        name: entry.name,
        type: entry.isDirectory() ? "dir" : "file",
        size: entry.isFile() ? stats.size : undefined,
        mtime: stats.mtime.toISOString()
      };
    });
}

function listSkills() {
  const skillsDir = path.join(repoRoot, "skills");
  if (!fs.existsSync(skillsDir)) return [];
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function recentDocs(limit = 10) {
  const docsDir = path.join(repoRoot, "docs");
  if (!fs.existsSync(docsDir)) return [];
  const files = [];
  const stack = [docsDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        const rel = path.relative(repoRoot, fullPath).replace(/\\/g, "/");
        const stats = fs.statSync(fullPath);
        files.push({ path: rel, mtime: stats.mtime.getTime() });
      }
    }
  }
  return files
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit)
    .map((item) => ({
      path: item.path,
      updated_at: new Date(item.mtime).toISOString()
    }));
}

function readPackageScripts() {
  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return Object.keys(pkg.scripts || {});
  } catch {
    return {};
  }
}

function loadEnvelope(envPath) {
  if (!envPath) return null;
  const abs = path.isAbsolute(envPath) ? envPath : path.join(repoRoot, envPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Envelope not found: ${envPath}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function buildMarkdownSummary(data) {
  const lines = [];
  lines.push(`# MOVA Skills Lab Snapshot`);
  lines.push("");
  lines.push(`- Generated at: ${data.generated_at}`);
  lines.push(`- Repo root: ${data.repo_root}`);
  lines.push(`- Branch: ${data.git.branch ?? "(unknown)"}`);
  lines.push(`- Commit: ${data.git.commit ?? "(unknown)"}`);
  lines.push(`- Node: ${data.runtime.node}`);
  lines.push("");
  lines.push("## Top-level Layout");
  data.top_level.forEach((entry) => {
    lines.push(`- ${entry.name} (${entry.type}) — updated ${entry.mtime}`);
  });
  lines.push("");
  lines.push(`## Skills (${data.skills.names.length})`);
  lines.push(data.skills.names.length ? data.skills.names.map((n) => `- ${n}`).join("\n") : "- (none)");
  lines.push("");
  lines.push("## Recently Updated Docs");
  lines.push(
    data.docs_recent.length
      ? data.docs_recent.map((doc) => `- ${doc.path} (updated ${doc.updated_at})`).join("\n")
      : "- (none)"
  );
  if (data.env) {
    lines.push("");
    lines.push("## Request Envelope");
    lines.push("```json");
    lines.push(JSON.stringify(data.env, null, 2));
    lines.push("```");
  }
  lines.push("");
  lines.push("## Available npm scripts");
  lines.push(data.npm_scripts.length ? data.npm_scripts.map((s) => `- ${s}`).join("\n") : "- (none)");
  lines.push("");
  return lines.join("\n");
}

function writeOutputs(outDir, summary) {
  ensureDir(outDir);
  const jsonPath = path.join(outDir, "snapshot.json");
  const mdPath = path.join(outDir, "snapshot.md");
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  fs.writeFileSync(mdPath, buildMarkdownSummary(summary));
  return { jsonPath, mdPath };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(
      [
        "Usage: node skills/repo_snapshot_basic/impl/bindings/node/cli.mjs [--env <path>] [--out <dir>]",
        "",
        "Example:",
        "  node skills/repo_snapshot_basic/impl/bindings/node/cli.mjs --env lab/examples/env.repo_snapshot_request_v1.mova_skills_lab.dpp_start.json"
      ].join("\n")
    );
    return;
  }

  const stamp = formatStamp();
  const outDir = args.out
    ? path.isAbsolute(args.out)
      ? args.out
      : path.join(repoRoot, args.out)
    : path.join(repoRoot, "lab", "repo_snapshot_runs", stamp);

  const env = args.env ? loadEnvelope(args.env) : null;
  const skillNames = listSkills();
  const summary = {
    generated_at: new Date().toISOString(),
    repo_root: repoRoot,
    git: {
      branch: runGit(["branch", "--show-current"]),
      commit: runGit(["rev-parse", "HEAD"])
    },
    runtime: {
      node: process.version,
      platform: process.platform
    },
    top_level: listTopLevel(),
    skills: {
      count: skillNames.length,
      names: skillNames
    },
    docs_recent: recentDocs(10),
    npm_scripts: readPackageScripts(),
    env
  };

  const outputs = writeOutputs(outDir, summary);
  console.log(`[repo_snapshot_basic] Snapshot written to ${outputs.jsonPath}`);
  console.log(`[repo_snapshot_basic] Markdown summary: ${outputs.mdPath}`);
}

try {
  main();
} catch (err) {
  console.error(`[repo_snapshot_basic] ERROR ${err.message || err}`);
  process.exitCode = 1;
}
