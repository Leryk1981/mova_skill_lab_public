#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--request-file") {
      args.requestFile = argv[++i];
    } else if (token === "--help" || token === "-h") {
      args.help = true;
    }
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node skills/wf_cycle_winner_pack_basic/impl/bindings/node/build_winner_pack.mjs --request-file <path/to/request.json>",
    "",
    "Example:",
    "  node skills/wf_cycle_winner_pack_basic/impl/bindings/node/build_winner_pack.mjs \\",
    "    --request-file skills/wf_cycle_winner_pack_basic/cases/case_WF_EX_WF_BUILD_WORKFLOW_001_pack_from_B_topdown.json"
  ].join("\n");
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function relPath(repoRoot, absPath) {
  const rel = path.relative(repoRoot, absPath).replace(/\\/g, "/");
  if (rel.startsWith("..")) return absPath.replace(/\\/g, "/");
  return rel;
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirRecursive(srcDir, destDir, { filter } = {}) {
  if (!fs.existsSync(srcDir)) return false;
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (filter && !filter(entry)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, { filter });
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath);
    }
  }
  return true;
}

function parseWinnerFromMd(mdPath) {
  const lines = fs.readFileSync(mdPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/Winner:\s*`([^`]+)`/);
    if (match) return match[1].trim();
  }
  return null;
}

function determineWinner({ compareDir, compareId, winnerConfig }) {
  const scorePath = path.join(compareDir, "score_computed.json");
  let winnerLabel = null;
  let participants = [];
  if (fs.existsSync(scorePath)) {
    const scoreObj = readJson(scorePath);
    winnerLabel = scoreObj?.winner || null;
    participants = Object.keys(scoreObj || {}).filter((key) => {
      const skip = ["formula", "compared", "winner", "computed_at"];
      return !skip.includes(key) && typeof scoreObj[key] === "object";
    });
    return { winnerLabel, participants };
  }
  const winnerMd = path.join(compareDir, "winner.md");
  if (fs.existsSync(winnerMd)) {
    winnerLabel = parseWinnerFromMd(winnerMd);
  }
  return { winnerLabel, participants };
}

function findBindingFile(bindingsDir) {
  if (!fs.existsSync(bindingsDir)) return null;
  const entries = fs
    .readdirSync(bindingsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".md"))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));
  if (!entries.length) return null;
  const preferred = entries.find((n) => n.toLowerCase().includes("binding"));
  return preferred ? path.join(bindingsDir, preferred) : path.join(bindingsDir, entries[0]);
}

function copySnapshot({ runDir, artifactsDir, bindingsDir, snapshotDir, ctx }) {
  ensureDir(snapshotDir);
  const files = ["operations.json", "instructions.json", "procedure.json"];
  for (const file of files) {
    const src = path.join(artifactsDir, file);
    if (!fs.existsSync(src)) throw new Error(`Missing ${relPath(ctx.repoRoot, src)} for snapshot`);
    const dest = path.join(snapshotDir, file);
    copyFile(src, dest);
    ctx.pathsWritten.push(relPath(ctx.repoRoot, dest));
  }
  const bindingSrc = findBindingFile(bindingsDir);
  if (bindingSrc) {
    const dest = path.join(snapshotDir, path.basename(bindingSrc));
    copyFile(bindingSrc, dest);
    ctx.pathsWritten.push(relPath(ctx.repoRoot, dest));
  } else {
    ctx.warnings.push(`No binding map found in ${relPath(ctx.repoRoot, bindingsDir)}`);
  }
}

function listSnapshotBindings(snapshotDir) {
  if (!fs.existsSync(snapshotDir)) return [];
  return fs
    .readdirSync(snapshotDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".md"))
    .map((d) => path.join(snapshotDir, d.name));
}

function copyArtifactsFromSnapshot({ snapshotDir, artifactsDest, bindingsDest, ctx }) {
  const artifactsFiles = ["operations.json", "instructions.json", "procedure.json"];
  ensureDir(artifactsDest);
  for (const file of artifactsFiles) {
    const src = path.join(snapshotDir, file);
    if (!fs.existsSync(src)) throw new Error(`Snapshot missing ${relPath(ctx.repoRoot, src)}`);
    const dest = path.join(artifactsDest, file);
    copyFile(src, dest);
    ctx.pathsWritten.push(relPath(ctx.repoRoot, dest));
  }
  ensureDir(bindingsDest);
  const bindingFiles = listSnapshotBindings(snapshotDir);
  if (!bindingFiles.length) {
    ctx.warnings.push(`Snapshot has no binding map: ${relPath(ctx.repoRoot, snapshotDir)}`);
  }
  for (const bindingSrc of bindingFiles) {
    const dest = path.join(bindingsDest, path.basename(bindingSrc));
    copyFile(bindingSrc, dest);
    ctx.pathsWritten.push(relPath(ctx.repoRoot, dest));
  }
}

function copyRunFolder({ srcRunDir, destRunsRoot, runId, ctx }) {
  const dest = path.join(destRunsRoot, runId);
  copyDirRecursive(srcRunDir, dest);
  ctx.pathsWritten.push(relPath(ctx.repoRoot, dest));
}

function copyRules({ experimentDir, outputRulesDir, computeScriptAbs, ctx }) {
  ensureDir(outputRulesDir);
  const rulesDir = path.join(experimentDir, "rules");
  const ruleFiles = ["SCOPE.md", "EVIDENCE_CHECKLIST.md", "check_diff_allowed.sh", "check_diff_allowed.ps1"];
  for (const file of ruleFiles) {
    const src = path.join(rulesDir, file);
    if (!fs.existsSync(src)) {
      ctx.warnings.push(`Rule file missing: ${relPath(ctx.repoRoot, src)}`);
      continue;
    }
    const dest = path.join(outputRulesDir, file);
    copyFile(src, dest);
    ctx.pathsWritten.push(relPath(ctx.repoRoot, dest));
  }
  const scriptDest = path.join(outputRulesDir, path.basename(computeScriptAbs));
  copyFile(computeScriptAbs, scriptDest);
  ctx.pathsWritten.push(relPath(ctx.repoRoot, scriptDest));
}

function copyCompare({ compareDir, compareId, outputCompareDir, abcSummaryPath, ctx }) {
  const dest = path.join(outputCompareDir, compareId);
  copyDirRecursive(compareDir, dest);
  ctx.pathsWritten.push(relPath(ctx.repoRoot, dest));
  if (abcSummaryPath && fs.existsSync(abcSummaryPath)) {
    const abcDest = path.join(outputCompareDir, "ABC_summary.md");
    copyFile(abcSummaryPath, abcDest);
    ctx.pathsWritten.push(relPath(ctx.repoRoot, abcDest));
  }
}

function buildReadme({ experimentId, winnerLabel, runId, outputDir, compareId, computeScriptRel, ctx }) {
  const lines = [
    `# Winner pack (${experimentId} / ${compareId})`,
    "",
    `Winner: \`${winnerLabel}\` (run: \`${runId}\`)`,
    "",
    "## Contents",
    "- `artifacts/operations|instructions|procedure.json` — canonical snapshot.",
    "- `bindings/*.md` — binding map for the run.",
    `- \`runs/${runId}/\` — raw evidence (event log, metrics, patch, notes).`,
    "- `rules/` — compute + guard scripts used in this experiment.",
    "- `compare/` — inputs/results that led to the selection.",
    "",
    "## Replay",
    "To recompute metrics deterministically:",
    "```bash",
    `node ${computeScriptRel} \\`,
    `  --ops artifacts/operations.json \\`,
    `  --instructions artifacts/instructions.json \\`,
    `  --procedure artifacts/procedure.json \\`,
    `  --event-log runs/${runId}/event_log.jsonl \\`,
    `  --metrics-file runs/${runId}/metrics.json \\`,
    "  --out runs/${runId}/metrics_replay.json --label winner",
    "```",
    "",
    "See `replay_check.log` for the last replay result."
  ];
  const readmePath = path.join(outputDir, "README.md");
  ensureDir(path.dirname(readmePath));
  fs.writeFileSync(readmePath, lines.join("\n") + "\n", "utf8");
  ctx.pathsWritten.push(relPath(ctx.repoRoot, readmePath));
}

function runReplayCheck({ computeScriptAbs, snapshotDir, runDir, outputDir, ctx }) {
  const ops = path.join(snapshotDir, "operations.json");
  const instructions = path.join(snapshotDir, "instructions.json");
  const procedure = path.join(snapshotDir, "procedure.json");
  const eventLog = path.join(runDir, "event_log.jsonl");
  const metricsFile = path.join(runDir, "metrics.json");
  const outJson = path.join(outputDir, "replay_metrics.json");
  const logPath = path.join(outputDir, "replay_check.log");

  const cmd = [
    computeScriptAbs,
    "--ops",
    ops,
    "--instructions",
    instructions,
    "--procedure",
    procedure,
    "--event-log",
    eventLog,
    "--metrics-file",
    metricsFile,
    "--out",
    outJson,
    "--label",
    "winner"
  ];

  const res = spawnSync("node", cmd, { encoding: "utf8" });
  const logLines = [
    `command: node ${cmd.map((c) => JSON.stringify(c)).join(" ")}`,
    `exit_code: ${res.status}`,
    res.stdout || "",
    res.stderr || ""
  ].join("\n");
  ensureDir(path.dirname(logPath));
  fs.writeFileSync(logPath, logLines + "\n", "utf8");
  ctx.pathsWritten.push(relPath(ctx.repoRoot, logPath));
  let replayPassed = res.status === 0;
  if (res.status !== 0) {
    ctx.warnings.push("Replay check failed — see replay_check.log");
  } else {
    ctx.pathsWritten.push(relPath(ctx.repoRoot, outJson));
  }
  return { replayPassed, replayMetricsPath: outJson };
}

function assertNotMemory(pathStr) {
  if (pathStr.replace(/\\/g, "/").includes("/lab/memory/")) {
    throw new Error("Refusing to write into lab/memory/**");
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (!args.requestFile) {
    console.error("[wf_cycle_winner_pack_basic] Missing --request-file");
    console.error(usage());
    process.exit(1);
  }

  const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
  const requestPath = path.isAbsolute(args.requestFile)
    ? args.requestFile
    : path.join(repoRoot, args.requestFile);
  const request = readJson(requestPath);

  const compareDirAbs = path.isAbsolute(request.compare_dir)
    ? request.compare_dir
    : path.join(repoRoot, request.compare_dir);
  const attemptsRootAbs = path.isAbsolute(request.attempts_root)
    ? request.attempts_root
    : path.join(repoRoot, request.attempts_root);
  const outputDirAbs = path.isAbsolute(request.output_dir)
    ? request.output_dir
    : path.join(repoRoot, request.output_dir);

  assertNotMemory(outputDirAbs);

  const experimentDir = path.dirname(path.dirname(compareDirAbs));
  const compareId = request.compare_id;
  const options = request.options || {};
  const include = request.include || {};
  const winnerConfig = request.winner || {};
  const tools = request.tools || {};
  const ensureSnapshot = options.ensure_artifacts_snapshot !== false;
  const replayCheck = options.replay_check !== false;

  const computeScriptRel =
    tools.compute_metrics_script || "wf_formalization_cycle_v1/tools/compute_metrics_from_artifacts.mjs";
  const computeScriptAbs = path.isAbsolute(computeScriptRel)
    ? computeScriptRel
    : path.join(repoRoot, computeScriptRel);
  if (!fs.existsSync(computeScriptAbs)) {
    throw new Error(`compute_metrics_script not found: ${computeScriptAbs}`);
  }

  const ctx = { repoRoot, pathsWritten: [], warnings: [] };

  const { winnerLabel: compareWinner, participants } = determineWinner({
    compareDir: compareDirAbs,
    compareId,
    winnerConfig
  });

  let winnerLabel = winnerConfig.label || compareWinner;
  if (!winnerLabel) {
    throw new Error("Unable to determine winner label");
  }
  const runId = winnerConfig.run_id || compareId;

  const winnerAttemptDir = path.join(attemptsRootAbs, winnerLabel, "wf_cycle");
  if (!fs.existsSync(winnerAttemptDir)) {
    throw new Error(`Winner attempt folder missing: ${winnerAttemptDir}`);
  }
  const winnerRunDir = path.join(winnerAttemptDir, "runs", runId);
  if (!fs.existsSync(winnerRunDir)) {
    throw new Error(`Winner run folder missing: ${winnerRunDir}`);
  }
  const snapshotDir = path.join(winnerRunDir, "artifacts_snapshot");
  if (!fs.existsSync(snapshotDir)) {
    if (!ensureSnapshot) throw new Error("artifacts_snapshot missing and ensure_artifacts_snapshot=false");
    copySnapshot({
      runDir: winnerRunDir,
      artifactsDir: path.join(winnerAttemptDir, "artifacts"),
      bindingsDir: path.join(winnerAttemptDir, "bindings"),
      snapshotDir,
      ctx
    });
  }

  ensureDir(outputDirAbs);

  const artifactsDest = path.join(outputDirAbs, "artifacts");
  const bindingsDest = path.join(outputDirAbs, "bindings");
  copyArtifactsFromSnapshot({ snapshotDir, artifactsDest, bindingsDest, ctx });

  const runsDestRoot = path.join(outputDirAbs, "runs");
  copyRunFolder({ srcRunDir: winnerRunDir, destRunsRoot: runsDestRoot, runId, ctx });

  if ((include.runs_dir || "winner_only") === "winner_plus_compare_inputs") {
    const otherLabels = participants.filter((p) => p !== winnerLabel);
    for (const other of otherLabels) {
      const otherAttemptDir = path.join(attemptsRootAbs, other, "wf_cycle");
      const otherRunDir = path.join(otherAttemptDir, "runs", runId);
      if (fs.existsSync(otherRunDir)) {
        copyRunFolder({ srcRunDir: otherRunDir, destRunsRoot: runsDestRoot, runId: `${runId}_${other}`, ctx });
      } else {
        ctx.warnings.push(`Could not locate compare run for ${other}: ${relPath(repoRoot, otherRunDir)}`);
      }
    }
  }

  if (include.rules !== false) {
    copyRules({
      experimentDir,
      outputRulesDir: path.join(outputDirAbs, "rules"),
      computeScriptAbs,
      ctx
    });
  }

  if (include.compare !== false) {
    const abcSummary = include.abc_summary_path
      ? path.isAbsolute(include.abc_summary_path)
        ? include.abc_summary_path
        : path.join(repoRoot, include.abc_summary_path)
      : path.join(path.dirname(compareDirAbs), "ABC_summary.md");
    copyCompare({
      compareDir: compareDirAbs,
      compareId,
      outputCompareDir: path.join(outputDirAbs, "compare"),
      abcSummaryPath: fs.existsSync(abcSummary) ? abcSummary : null,
      ctx
    });
  }

  buildReadme({
    experimentId: request.experiment_id,
    winnerLabel,
    runId,
    outputDir: outputDirAbs,
    compareId,
    computeScriptRel,
    ctx
  });

  let replayPassed = false;
  if (replayCheck) {
    const replay = runReplayCheck({
      computeScriptAbs,
      snapshotDir,
      runDir: winnerRunDir,
      outputDir: outputDirAbs,
      ctx
    });
    replayPassed = replay.replayPassed;
  }

  const status = replayCheck && !replayPassed ? "error" : "ok";
  const notes =
    status === "error"
      ? "winner_pack assembled but replay_check failed"
      : ctx.warnings.length
      ? `winner_pack assembled (warnings: ${ctx.warnings.join(" | ")})`
      : "winner_pack assembled";
  const result = {
    status,
    winner_label: winnerLabel,
    winner_run_dir: relPath(repoRoot, winnerRunDir),
    output_dir: relPath(repoRoot, outputDirAbs),
    paths_written: ctx.pathsWritten,
    warnings: ctx.warnings,
    notes,
    replay_check_passed: replayPassed
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

try {
  main();
} catch (error) {
  const message = error && typeof error === "object" && "message" in error ? error.message : String(error);
  const result = {
    status: "error",
    winner_label: null,
    winner_run_dir: null,
    output_dir: "",
    paths_written: [],
    warnings: [],
    notes: message
  };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(1);
}
