#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
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
    "  node skills/wf_cycle_scaffold_basic/impl/bindings/node/scaffold_experiment.mjs --request-file <path/to/request.json>",
    "",
    "Example:",
    "  node skills/wf_cycle_scaffold_basic/impl/bindings/node/scaffold_experiment.mjs \\",
    "    --request-file skills/wf_cycle_scaffold_basic/cases/case_WF_EX_WF_SCAFFOLD_SMOKE_001.json"
  ].join("\n");
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function normalizedRelative(repoRoot, absPath) {
  const rel = path.relative(repoRoot, absPath).replace(/\\/g, "/");
  if (rel.startsWith("..")) return absPath.replace(/\\/g, "/");
  return rel;
}

function ensureParentDir(absPath) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
}

function copyDirectoryContents({ srcDir, destDir, ctx }) {
  if (!fs.existsSync(srcDir)) {
    ctx.warnings.push(`Template directory missing: ${normalizedRelative(ctx.repoRoot, srcDir)}`);
    ctx.logLines.push(`[warn] template missing ${normalizedRelative(ctx.repoRoot, srcDir)}`);
    return;
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  if (!entries.length) return;
  ensureDir({ dir: destDir, ctx });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryContents({ srcDir: srcPath, destDir: destPath, ctx });
    } else if (entry.isFile()) {
      copyFile({ src: srcPath, dest: destPath, ctx });
    }
  }
}

function ensureDir({ dir, ctx }) {
  if (fs.existsSync(dir)) return false;
  if (!ctx.writeFiles) {
    ctx.pathsSkipped.push(normalizedRelative(ctx.repoRoot, dir));
    ctx.logLines.push(`[skip] ${normalizedRelative(ctx.repoRoot, dir)} (write_files=false)`);
    return false;
  }
  fs.mkdirSync(dir, { recursive: true });
  ctx.pathsWritten.push(normalizedRelative(ctx.repoRoot, dir));
  ctx.logLines.push(`[dir] created ${normalizedRelative(ctx.repoRoot, dir)}`);
  return true;
}

function skipPath({ target, ctx, reason }) {
  const rel = normalizedRelative(ctx.repoRoot, target);
  ctx.pathsSkipped.push(rel);
  ctx.warnings.push(`${rel}: ${reason}`);
  ctx.logLines.push(`[skip] ${rel} (${reason})`);
}

function copyFile({ src, dest, ctx }) {
  if (!fs.existsSync(src)) {
    ctx.warnings.push(`Template file missing: ${normalizedRelative(ctx.repoRoot, src)}`);
    ctx.logLines.push(`[warn] template missing ${normalizedRelative(ctx.repoRoot, src)}`);
    return false;
  }
  const exists = fs.existsSync(dest);
  if (exists && ctx.safeMode) {
    skipPath({ target: dest, ctx, reason: "exists (safe_mode)" });
    return false;
  }
  if (!ctx.writeFiles) {
    skipPath({ target: dest, ctx, reason: "write_files=false" });
    return false;
  }
  ensureParentDir(dest);
  fs.copyFileSync(src, dest);
  ctx.pathsWritten.push(normalizedRelative(ctx.repoRoot, dest));
  ctx.logLines.push(
    `[copy] ${normalizedRelative(ctx.repoRoot, src)} -> ${normalizedRelative(ctx.repoRoot, dest)}`
  );
  return true;
}

function writeTextFile({ dest, content, ctx, allowAppend = false }) {
  const exists = fs.existsSync(dest);
  if (!ctx.writeFiles) {
    skipPath({ target: dest, ctx, reason: "write_files=false" });
    return false;
  }
  if (exists && ctx.safeMode && !allowAppend) {
    skipPath({ target: dest, ctx, reason: "exists (safe_mode)" });
    return false;
  }
  ensureParentDir(dest);
  if (allowAppend && exists) {
    fs.appendFileSync(dest, content, "utf8");
  } else {
    fs.writeFileSync(dest, content, "utf8");
  }
  ctx.pathsWritten.push(normalizedRelative(ctx.repoRoot, dest));
  ctx.logLines.push(
    `${allowAppend ? "[append]" : "[write]"} ${normalizedRelative(ctx.repoRoot, dest)}`
  );
  return true;
}

function participantBrief({ participant, wfCycleDir, ctx, experimentId }) {
  const relZone = normalizedRelative(ctx.repoRoot, wfCycleDir);
  return [
    `# Participant brief — ${participant}`,
    "",
    `Experiment: ${experimentId}`,
    `Working zone: ${relZone}`,
    "",
    "## Guardrails",
    "- Read-only: everything outside the working zone (`core/**`, `lab/memory/**`, canonical wf_cycle inputs).",
    "- Write-only: stay inside your attempt folder.",
    "",
    "## Runs",
    "- `runs/A_spiral` — first pass (spiral).",
    "- `runs/B_topdown` — enriched top-down pass.",
    "- `runs/C_bottomup` — evidence-first bottom-up pass.",
    "",
    "Each run must capture: `event_log.jsonl` (with META + ctx + METRICS_CALC), `metrics.json`, `scorecard.json`, command logs, and notes.",
    "",
    "## Compare readiness",
    "- Keep artifacts/instructions/procedure bound via IDs.",
    "- Maintain `bindings/*.md` to explain canonical refs.",
    "- Run diff-guard before handing off evidence."
  ].join("\n");
}

function bindingPlaceholder() {
  return [
    "# Binding map (placeholder)",
    "",
    "operation_id | canonical ref | evidence | expected effect | risk",
    "---|---|---|---|---",
    "op.sample | canonical/ref/path | runs/A_spiral/event_log.jsonl | describe proof | medium"
  ].join("\n");
}

function experimentReadme({ experimentId, participants }) {
  return [
    `# Experiment ${experimentId}`,
    "",
    "Scaffold generated via `skill.wf_cycle_scaffold_basic`.",
    "",
    "## Goal",
    "Run wf_cycle (A/B/C) inside dedicated attempt zones without touching canonical inputs.",
    "",
    "## Participants",
    ...participants.map((p) => `- ${p}: \`attempts/${p}/wf_cycle\``),
    "",
    "## Structure",
    "- `rules/` — scope, evidence checklist, diff-guards.",
    "- `inputs/` — workflow target + contextual briefs.",
    "- `attempts/<participant>/wf_cycle/` — artifacts, bindings, runs.",
    "- `compare/` & `outputs/` — to be populated during the experiment.",
    "",
    "## Guardrails",
    "- Never write to `lab/memory/**`.",
    "- diff-guard must pass before sharing results.",
    "",
    "## Next steps",
    "Customize inputs, fill binding maps, and start Attempt A (spiral)."
  ].join("\n");
}

function resolveTemplateDir(repoRoot, request) {
  const relative = request?.template_source?.wf_cycle_dir || "wf_formalization_cycle_v1";
  return path.isAbsolute(relative) ? relative : path.join(repoRoot, relative);
}

function ensureRuleFile({ ctx, experimentRulesDir, templateDir, fileName, fallback }) {
  const templatePath = path.join(templateDir, "rules", fileName);
  const dest = path.join(experimentRulesDir, fileName);
  if (fs.existsSync(templatePath)) {
    copyFile({ src: templatePath, dest, ctx });
  } else {
    writeTextFile({ dest, content: fallback, ctx });
  }
}

function ensureGuardScript({ ctx, experimentRulesDir, templateDir, fileName, fallback }) {
  const templatePath = path.join(templateDir, "tools", fileName);
  const dest = path.join(experimentRulesDir, fileName);
  if (fs.existsSync(templatePath)) {
    copyFile({ src: templatePath, dest, ctx });
  } else {
    writeTextFile({ dest, content: fallback, ctx });
  }
}

function copyArtifactsTemplates({ ctx, artifactsSrcDir, artifactsDestDir }) {
  if (!fs.existsSync(artifactsSrcDir)) {
    ctx.warnings.push(`Artifacts template dir missing: ${normalizedRelative(ctx.repoRoot, artifactsSrcDir)}`);
    ctx.logLines.push(`[warn] artifacts template missing ${normalizedRelative(ctx.repoRoot, artifactsSrcDir)}`);
    return;
  }
  ensureDir({ dir: artifactsDestDir, ctx });
  const entries = fs.readdirSync(artifactsSrcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const src = path.join(artifactsSrcDir, entry.name);
    const dest = path.join(artifactsDestDir, entry.name);
    copyFile({ src, dest, ctx });
  }
}

function selectRunTemplate({ runsRoot, prefix }) {
  if (!fs.existsSync(runsRoot)) return null;
  const entries = fs
    .readdirSync(runsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.toUpperCase().startsWith(prefix.toUpperCase()))
    .map((d) => d.name)
    .sort();
  if (!entries.length) return null;
  return path.join(runsRoot, entries[0]);
}

function scaffoldRuns({ ctx, wfCycleDir, templateRunsDir }) {
  const runsDest = path.join(wfCycleDir, "runs");
  ensureDir({ dir: runsDest, ctx });
  const mappings = [
    { target: "A_spiral", prefix: "WF_RUN_0001" },
    { target: "B_topdown", prefix: "WF_RUN_0002" },
    { target: "C_bottomup", prefix: "WF_RUN_0003" }
  ];
  for (const mapping of mappings) {
    const dest = path.join(runsDest, mapping.target);
    ensureDir({ dir: dest, ctx });
    const src = selectRunTemplate({ runsRoot: templateRunsDir, prefix: mapping.prefix });
    if (src) {
      copyDirectoryContents({ srcDir: src, destDir: dest, ctx });
    } else {
      ctx.warnings.push(`Run template missing for prefix ${mapping.prefix}`);
      ctx.logLines.push(`[warn] run template missing ${mapping.prefix}`);
    }
  }
}

function seedInputs({ ctx, inputsDir, inputsSeed }) {
  if (!inputsSeed || !Array.isArray(inputsSeed.files)) return;
  for (const fileSeed of inputsSeed.files) {
    const relPath = fileSeed.rel_path || fileSeed.relPath;
    if (!relPath) continue;
    const dest = path.join(inputsDir, relPath);
    writeTextFile({ dest, content: fileSeed.content || "", ctx });
  }
}

function writeLog({ ctx, logPath }) {
  if (!ctx.writeFiles) return;
  const header = `# scaffold run ${new Date().toISOString()}\n`;
  const tail = ctx.logLines.length ? ctx.logLines.join("\n") : "(no operations)";
  const body = `${header}${tail}\n\n`;
  ensureParentDir(logPath);
  fs.appendFileSync(logPath, body, "utf8");
  ctx.pathsWritten.push(normalizedRelative(ctx.repoRoot, logPath));
}

function scaffoldParticipant({ participant, ctx, experimentDir, templateDir, experimentId }) {
  const participantDir = path.join(experimentDir, "attempts", participant);
  const wfCycleDir = path.join(participantDir, "wf_cycle");
  ensureDir({ dir: participantDir, ctx });
  ensureDir({ dir: wfCycleDir, ctx });
  const artifactsDest = path.join(wfCycleDir, "artifacts");
  const bindingsDest = path.join(wfCycleDir, "bindings");
  ensureDir({ dir: artifactsDest, ctx });
  ensureDir({ dir: bindingsDest, ctx });

  const templateArtifactsDir = path.join(templateDir, "artifacts");
  const templateRunsDir = path.join(templateDir, "runs");

  copyArtifactsTemplates({ ctx, artifactsSrcDir: templateArtifactsDir, artifactsDestDir: artifactsDest });
  scaffoldRuns({ ctx, wfCycleDir, templateRunsDir });

  const bindingFile = path.join(bindingsDest, "binding_map.md");
  writeTextFile({ dest: bindingFile, content: bindingPlaceholder(), ctx });

  const briefPath = path.join(participantDir, "00_participant_brief.md");
  writeTextFile({
    dest: briefPath,
    content: participantBrief({ participant, wfCycleDir, ctx, experimentId }),
    ctx
  });
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (!args.requestFile) {
    console.error("[wf_cycle_scaffold_basic] Missing --request-file");
    console.error(usage());
    process.exit(1);
  }

  const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
  const requestPath = path.isAbsolute(args.requestFile)
    ? args.requestFile
    : path.join(repoRoot, args.requestFile);

  const request = readJson(requestPath);
  const experimentId = request.experiment_id || "WF_EX_WF_CYCLE";
  const experimentDirAbs = path.isAbsolute(request.experiment_dir)
    ? request.experiment_dir
    : path.join(repoRoot, request.experiment_dir);

  const normalizedExperimentDir = experimentDirAbs.replace(/\\/g, "/");
  if (normalizedExperimentDir.includes("/lab/memory/")) {
    throw new Error("experiment_dir must not be inside lab/memory/**");
  }

  const participants = Array.isArray(request.participants) && request.participants.length
    ? request.participants
    : ["codex_ide", "codex_cli"];

  const options = request.options || {};
  const safeMode = typeof options.safe_mode === "boolean" ? options.safe_mode : true;
  const writeFiles = typeof options.write_files === "boolean" ? options.write_files : true;

  const ctx = {
    repoRoot,
    safeMode,
    writeFiles,
    warnings: [],
    logLines: [],
    pathsWritten: [],
    pathsSkipped: []
  };

  ctx.logLines.push(`[info] scaffold start experiment=${experimentId} safe_mode=${safeMode} write_files=${writeFiles}`);

  const templateDir = resolveTemplateDir(repoRoot, request);
  if (!fs.existsSync(templateDir)) {
    throw new Error(`wf_cycle template directory not found: ${templateDir}`);
  }

  const experimentDir = experimentDirAbs;
  ensureDir({ dir: experimentDir, ctx });
  const rulesDir = path.join(experimentDir, "rules");
  const inputsDir = path.join(experimentDir, "inputs");
  const attemptsDir = path.join(experimentDir, "attempts");
  const compareDir = path.join(experimentDir, "compare");
  const outputsDir = path.join(experimentDir, "outputs");
  const logsDir = path.join(experimentDir, "logs");

  ensureDir({ dir: rulesDir, ctx });
  ensureDir({ dir: inputsDir, ctx });
  ensureDir({ dir: attemptsDir, ctx });
  ensureDir({ dir: compareDir, ctx });
  ensureDir({ dir: outputsDir, ctx });
  ensureDir({ dir: logsDir, ctx });

  const scopeFallback = [
    "# Scope (auto-generated)",
    "- READ-ONLY: everything outside this experiment folder.",
    "- WRITE-ALLOWED: lab/experiments/<experiment_id>/** only.",
    "- Forbidden: lab/memory/**, core/**."
  ].join("\n");
  const evidenceFallback = [
    "# Evidence checklist (auto-generated)",
    "- event_log.jsonl (append-only, META + ctx + METRICS_CALC).",
    "- metrics.json (matches METRICS_CALC).",
    "- scorecard.json.",
    "- notes.md.",
    "- diff_guard log."
  ].join("\n");
  const shFallback = "#!/usr/bin/env bash\nset -euo pipefail\nif git diff --name-only | grep -v \"^lab/experiments/\" | grep -q .; then\n  echo \"Diff outside lab/experiments/** detected\" >&2\n  exit 1\nfi\n";
  const psFallback = "@echo off\ngit diff --name-only | findstr /R /V \"^lab/experiments/\" > nul\nif %errorlevel%==0 (\n  echo Diff outside lab/experiments/** detected\n  exit /b 1\n)\n";

  ensureRuleFile({ ctx, experimentRulesDir: rulesDir, templateDir, fileName: "SCOPE.md", fallback: scopeFallback });
  ensureRuleFile({
    ctx,
    experimentRulesDir: rulesDir,
    templateDir,
    fileName: "EVIDENCE_CHECKLIST.md",
    fallback: evidenceFallback
  });

  ensureGuardScript({
    ctx,
    experimentRulesDir: rulesDir,
    templateDir,
    fileName: "check_diff_allowed.sh",
    fallback: shFallback
  });

  const includePs1 = request.rules_profile?.include_ps1_guard !== false;
  if (includePs1) {
    ensureGuardScript({
      ctx,
      experimentRulesDir: rulesDir,
      templateDir,
      fileName: "check_diff_allowed.ps1",
      fallback: psFallback
    });
  }

  seedInputs({ ctx, inputsDir, inputsSeed: request.inputs_seed });

  const readmePath = path.join(experimentDir, "README.md");
  writeTextFile({ dest: readmePath, content: experimentReadme({ experimentId, participants }), ctx });

  for (const participant of participants) {
    scaffoldParticipant({ participant, ctx, experimentDir, templateDir, experimentId });
  }

  const logPath = path.join(logsDir, "setup_scaffold.log");
  ctx.logLines.push(`[summary] wrote=${ctx.pathsWritten.length} skipped=${ctx.pathsSkipped.length} warnings=${ctx.warnings.length}`);
  writeLog({ ctx, logPath });

  let notes;
  if (!writeFiles) {
    notes = "Dry-run: write_files=false; reporting planned skips/warnings only.";
  } else if (ctx.warnings.length > 0) {
    notes = `Scaffold completed with warnings: ${ctx.warnings.join(" | ")}`;
  } else {
    notes = "Scaffold completed (safe_mode/write_files respected).";
  }

  const result = {
    status: "ok",
    experiment_dir: normalizedRelative(repoRoot, experimentDir),
    paths_written: ctx.pathsWritten,
    paths_skipped: ctx.pathsSkipped,
    warnings: ctx.warnings,
    notes
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

try {
  main();
} catch (error) {
  const message = error && typeof error === "object" && "message" in error ? error.message : String(error);
  const result = {
    status: "error",
    experiment_dir: null,
    paths_written: [],
    paths_skipped: [],
    warnings: [],
    notes: message
  };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(1);
}
