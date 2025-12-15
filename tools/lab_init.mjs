#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function getNpmInvocation(args) {
  if (process.env.npm_execpath) {
    return {
      cmd: process.execPath,
      args: [process.env.npm_execpath, ...args]
    };
  }
  return { cmd: npmCmd, args };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token) continue;
    if (token === "--query") args.query = argv[++i];
    else if (token === "--out") args.out = argv[++i];
    else if (token === "--public") args.public = true;
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

function log(message) {
  console.log(`[lab:init] ${message}`);
}

function runGit(args) {
  const res = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
  if (res.status !== 0) return null;
  return res.stdout.trim();
}

function writeTextFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
}

function runAndCapture(name, cmd, args, logPath) {
  log(`Running ${name}: ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { cwd: repoRoot, encoding: "utf8" });
  const combined = `${res.stdout || ""}${res.stderr || ""}`;
  writeTextFile(logPath, combined);
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.error) {
    log(`${name} ERROR: ${res.error.message}`);
    return false;
  }
  if (res.status !== 0) {
    log(`${name} FAILED (exit ${res.status})`);
    return false;
  }
  log(`${name} PASS`);
  return true;
}

function findSnapshotEnv() {
  const examplesDir = path.join(repoRoot, "lab", "examples");
  if (!fs.existsSync(examplesDir)) return null;
  const candidates = fs
    .readdirSync(examplesDir)
    .filter((name) => name.startsWith("env.repo_snapshot_request_v1") && name.endsWith(".json"))
    .sort();
  if (!candidates.length) return null;
  return path.join(examplesDir, candidates[0]);
}

function runSnapshot(outDir) {
  const snapshotDir = path.join(outDir, "snapshot");
  ensureDir(snapshotDir);
  const scriptPath = path.join(
    repoRoot,
    "skills",
    "repo_snapshot_basic",
    "impl",
    "bindings",
    "node",
    "cli.mjs"
  );
  if (!fs.existsSync(scriptPath)) {
    log("SKIP snapshot: node CLI missing");
    return { status: "skipped", reason: "missing CLI" };
  }
  const args = [scriptPath, "--out", snapshotDir];
  const envPath = findSnapshotEnv();
  if (envPath) {
    args.push("--env", envPath);
  }
  const res = spawnSync("node", args, { cwd: repoRoot, encoding: "utf8" });
  const combined = `${res.stdout || ""}${res.stderr || ""}`;
  writeTextFile(path.join(snapshotDir, "run.log"), combined);
  if (res.status !== 0) {
    log("Snapshot FAILED");
    return { status: "failed", reason: "snapshot CLI error" };
  }
  log("Snapshot PASS");
  return { status: "ok", output: snapshotDir };
}

async function restoreContext(outDir, query) {
  ensureDir(outDir);
  const sqlitePath = path.join(repoRoot, "lab", "memory", "lab_memory.sqlite");
  const publicMirror =
    repoRoot.toLowerCase().includes("_public") ||
    repoRoot.toLowerCase().endsWith("mova_skill_lab_public");

  if (publicMirror) {
    const summary = {
      status: "skipped",
      reason: "SKIP (public mirror): SQLite memory not available."
    };
    writeTextFile(path.join(outDir, "context_restore.json"), JSON.stringify(summary, null, 2));
    writeTextFile(
      path.join(outDir, "context_restore.md"),
      "# Context Restore\n\nSKIP (public mirror): SQLite memory not available."
    );
    log("Context restore SKIP (public mirror)");
    return summary;
  }

  // Step 1: Initialize SQLite if missing
  if (!fs.existsSync(sqlitePath)) {
    log("Initializing SQLite memory...");
    const initInvocation = getNpmInvocation(["run", "lab:memory:init"]);
    if (!runAndCapture("lab:memory:init", initInvocation.cmd, initInvocation.args, path.join(outDir, "memory_init.log"))) {
      const summary = {
        status: "skipped",
        reason: "Failed to initialize SQLite memory"
      };
      writeTextFile(path.join(outDir, "context_restore.json"), JSON.stringify(summary, null, 2));
      writeTextFile(
        path.join(outDir, "context_restore.md"),
        "# Context Restore\n\nSKIP: failed to initialize SQLite memory."
      );
      log("Context restore SKIP (init failed)");
      return summary;
    }
  }

  // Step 2: Import episodes/decisions
  log("Importing episodes/decisions into SQLite memory...");
  const importInvocation = getNpmInvocation(["run", "lab:memory:import"]);
  runAndCapture("lab:memory:import", importInvocation.cmd, importInvocation.args, path.join(outDir, "memory_import.log"));

  // Step 3: Query memory
  log(`Querying SQLite memory with query: "${query || "(all)"}"`);
  const queryArgs = ["run", "lab:memory:query", "--", "--query", query || "", "--limit", "20", "--out", outDir];
  const queryInvocation = getNpmInvocation(queryArgs);
  const querySuccess = runAndCapture("lab:memory:query", queryInvocation.cmd, queryInvocation.args, path.join(outDir, "memory_query.log"));

  // Check if context_restore.json was created by lab_memory.mjs
  const contextJsonPath = path.join(outDir, "context_restore.json");
  if (fs.existsSync(contextJsonPath)) {
    const summary = JSON.parse(fs.readFileSync(contextJsonPath, "utf8"));
    if (summary.status === "ok") {
      log(`Context restore PASS (${summary.rows?.length || 0} rows)`);
    } else {
      log(`Context restore ${summary.status} (${summary.reason || ""})`);
    }
    return summary;
  }

  // Fallback if files weren't created
  const summary = {
    status: querySuccess ? "ok" : "failed",
    query: query || "(all)",
    reason: querySuccess ? "Query completed but no output files found" : "Query command failed"
  };
  writeTextFile(contextJsonPath, JSON.stringify(summary, null, 2));
  writeTextFile(
    path.join(outDir, "context_restore.md"),
    `# Context Restore\n\nQuery: \`${query || "(all)"}\`\n\n${summary.reason}`
  );
  log(`Context restore ${summary.status}`);
  return summary;
}

function shouldRunSmoke(isPublicFlag) {
  if (isPublicFlag) return true;
  const ciPath = path.join(repoRoot, ".github", "workflows", "ci.yml");
  if (!fs.existsSync(ciPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
    return Boolean(pkg.scripts && pkg.scripts["smoke:wf_cycle"]);
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      [
        "Usage: npm run lab:init -- [--query <text>] [--out <dir>] [--public]",
        "",
        "Steps:",
        "  1. repo snapshot (node CLI)",
        "  2. context restore (sqlite, if available)",
        "  3. baseline gates (validate/test[/smoke])"
      ].join("\n")
    );
    return;
  }

  const query = args.query || "infra";
  const stamp = formatStamp();
  const outDir = args.out
    ? path.isAbsolute(args.out)
      ? args.out
      : path.join(repoRoot, args.out)
    : path.join(repoRoot, "lab", "init_runs", stamp);
  ensureDir(outDir);

  log(`Repo root: ${repoRoot}`);
  log(`Branch: ${runGit(["branch", "--show-current"]) || "(unknown)"}`);
  log(`Commit: ${runGit(["rev-parse", "HEAD"]) || "(unknown)"}`);
  log(`Output dir: ${outDir}`);

  const snapshotResult = runSnapshot(outDir);
  const contextResult = await restoreContext(path.join(outDir, "context"), query);

  const baselineDir = path.join(outDir, "baseline");
  ensureDir(baselineDir);
  const baselineResults = [];
  const validateInvocation = getNpmInvocation(["run", "validate"]);
  baselineResults.push(
    runAndCapture(
      "validate",
      validateInvocation.cmd,
      validateInvocation.args,
      path.join(baselineDir, "validate.txt")
    )
  );
  const testInvocation = getNpmInvocation(["test"]);
  baselineResults.push(
    runAndCapture(
      "test",
      testInvocation.cmd,
      testInvocation.args,
      path.join(baselineDir, "test.txt")
    )
  );

  if (shouldRunSmoke(Boolean(args.public))) {
    const smokeInvocation = getNpmInvocation(["run", "smoke:wf_cycle"]);
    baselineResults.push(
      runAndCapture(
        "smoke:wf_cycle",
        smokeInvocation.cmd,
        smokeInvocation.args,
        path.join(baselineDir, "smoke.txt")
      )
    );
  } else {
    log("Smoke skip (not requested)");
  }

  const success = baselineResults.every(Boolean);
  if (!success) {
    log("lab:init completed with failures.");
    process.exitCode = 1;
    return;
  }

  log("lab:init PASS");
}

main().catch((err) => {
  console.error(`[lab:init] ERROR ${err.stack || err.message || err}`);
  process.exitCode = 1;
});
