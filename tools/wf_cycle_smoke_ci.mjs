#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function runNodeScript(scriptRelPath, args = []) {
  const scriptPath = path.isAbsolute(scriptRelPath)
    ? scriptRelPath
    : path.join(repoRoot, scriptRelPath);
  const argv = ["node", scriptPath, ...args];
  const res = spawnSync(argv[0], argv.slice(1), { encoding: "utf8", cwd: repoRoot });
  if (res.error) throw res.error;
  return {
    status: res.status,
    stdout: res.stdout.trim(),
    stderr: res.stderr.trim()
  };
}

function writeTempJson(obj, prefix) {
  const tempFile = path.join(os.tmpdir(), `${prefix}_${Date.now()}.json`);
  fs.writeFileSync(tempFile, JSON.stringify(obj, null, 2), "utf8");
  return tempFile;
}

function ensureJsonResult(output, stepName) {
  if (!output.stdout) {
    throw new Error(`${stepName}: empty stdout\nstderr:\n${output.stderr}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(output.stdout);
  } catch (err) {
    throw new Error(`${stepName}: failed to parse JSON: ${err.message}\nstdout:\n${output.stdout}`);
  }
  if (output.status !== 0 && parsed.status !== "ok") {
    throw new Error(`${stepName}: process failed (exit ${output.status})\nstdout:\n${output.stdout}\nstderr:\n${output.stderr}`);
  }
  return parsed;
}

function deleteDirIfExists(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function backupExistingDirectory(dirAbs) {
  const abs = dirAbs;
  if (!fs.existsSync(abs)) return null;
  const backupPath = `${abs}_wf_cycle_ci_backup_${Date.now()}`;
  deleteDirIfExists(backupPath);
  fs.renameSync(abs, backupPath);
  return { original: abs, backup: backupPath };
}

function restoreBackup(backupInfo) {
  if (!backupInfo) return;
  const { original, backup } = backupInfo;
  deleteDirIfExists(original);
  fs.renameSync(backup, original);
}

function readJsonFile(relPath) {
  const abs = path.isAbsolute(relPath) ? relPath : path.join(repoRoot, relPath);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function main() {
  const createdPaths = [];
  try {
    // Step 1: scaffold
    const scaffoldId = `WF_EX_WF_CI_SMOKE_${Date.now()}`;
    const scaffoldDir = path.join("lab", "experiments", scaffoldId);
    const scaffoldRequest = {
      experiment_id: scaffoldId,
      experiment_dir: scaffoldDir,
      participants: ["codex_ide", "codex_cli"],
      options: { safe_mode: true, write_files: true }
    };
    const scaffoldReqPath = writeTempJson(scaffoldRequest, "wf_cycle_scaffold");
    try {
      const scaffoldResult = ensureJsonResult(
        runNodeScript("skills/wf_cycle_scaffold_basic/impl/bindings/node/scaffold_experiment.mjs", [
          "--request-file",
          scaffoldReqPath
        ]),
        "scaffold"
      );
      if (scaffoldResult.status !== "ok") {
        throw new Error(`scaffold: status=${scaffoldResult.status} notes=${scaffoldResult.notes}`);
      }
      createdPaths.push(path.join(repoRoot, scaffoldDir));
    } finally {
      fs.unlinkSync(scaffoldReqPath);
    }

    // Step 2: compare (existing case)
    const compareCasePath =
      "skills/wf_cycle_compute_compare_basic/cases/case_WF_EX_WF_BUILD_WORKFLOW_001_B_topdown.json";
    const compareResult = ensureJsonResult(
      runNodeScript("skills/wf_cycle_compute_compare_basic/impl/bindings/node/compute_compare.mjs", [
        "--request-file",
        compareCasePath
      ]),
      "compare"
    );
    if (compareResult.status !== "ok") {
      throw new Error(`compare: status=${compareResult.status} notes=${compareResult.notes}`);
    }
    if (!compareResult.winner_label) {
      throw new Error("compare: winner_label is empty");
    }
    if (!Array.isArray(compareResult.paths_written) || compareResult.paths_written.length < 6) {
      throw new Error("compare: expected at least 6 paths_written");
    }
    const compareOutputDir = path.join(
      repoRoot,
      "lab",
      "experiments",
      "WF_EX_WF_BUILD_WORKFLOW_001",
      "compare",
      "B_topdown_skill"
    );
    createdPaths.push(compareOutputDir);

    // Step 3: winner pack (existing case)
    const winnerCasePath =
      "skills/wf_cycle_winner_pack_basic/cases/case_WF_EX_WF_BUILD_WORKFLOW_001_pack_from_B_topdown.json";
    const winnerCase = readJsonFile(winnerCasePath);
    const winnerOutputDirAbs = path.join(repoRoot, winnerCase.output_dir);
    const winnerBackup = backupExistingDirectory(winnerOutputDirAbs);
    try {
      const winnerPackResult = ensureJsonResult(
        runNodeScript("skills/wf_cycle_winner_pack_basic/impl/bindings/node/build_winner_pack.mjs", [
          "--request-file",
          winnerCasePath
        ]),
        "winner_pack"
      );
      if (winnerPackResult.status !== "ok") {
        throw new Error(`winner_pack: status=${winnerPackResult.status} notes=${winnerPackResult.notes}`);
      }
      if (Array.isArray(winnerPackResult.warnings) && winnerPackResult.warnings.length > 0) {
        throw new Error(`winner_pack: warnings present -> ${winnerPackResult.warnings.join(" | ")}`);
      }
    } finally {
      deleteDirIfExists(winnerOutputDirAbs);
      restoreBackup(winnerBackup);
    }

    console.log("[wf_cycle_smoke_ci] PASS: scaffold, compare, winner_pack");
  } finally {
    for (const p of createdPaths) {
      deleteDirIfExists(p);
    }
  }
}

try {
  main();
} catch (error) {
  console.error("[wf_cycle_smoke_ci] FAIL:", error.message);
  process.exit(1);
}
