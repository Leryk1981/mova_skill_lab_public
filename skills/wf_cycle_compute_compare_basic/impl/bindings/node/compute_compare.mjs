#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { computeIC, normalizeMetricValue, normalizePathForInputs } from "../../lib/ic_utils.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--request-file") args.requestFile = argv[++i];
    else if (k === "--help" || k === "-h") args.help = true;
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node skills/wf_cycle_compute_compare_basic/impl/bindings/node/compute_compare.mjs --request-file <path/to/request.json>",
    "",
    "Example:",
    "  node skills/wf_cycle_compute_compare_basic/impl/bindings/node/compute_compare.mjs \\",
    "    --request-file skills/wf_cycle_compute_compare_basic/cases/case_WF_EX_WF_BUILD_WORKFLOW_001_B_topdown.json"
  ].join("\n");
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeText(p, text) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, "utf8");
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function safeLabel(label) {
  const s = String(label || "").trim();
  if (!s) return "side";
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function resolveRunSnapshotArtifacts({ runDirAbs, artifactsDirAbs, bindingMapAbs }) {
  const snapshotDir = path.join(runDirAbs, "artifacts_snapshot");
  const opsSnap = path.join(snapshotDir, "operations.json");
  const insSnap = path.join(snapshotDir, "instructions.json");
  const procSnap = path.join(snapshotDir, "procedure.json");

  if (!(fs.existsSync(opsSnap) && fs.existsSync(insSnap) && fs.existsSync(procSnap))) {
    return { artifactsDirAbs, bindingMapAbs, snapshotUsed: false, snapshotDir };
  }

  let bindingFromSnapshot = null;
  const preferred = path.join(snapshotDir, "repo_change_plan_binding_map.md");
  if (fs.existsSync(preferred)) {
    bindingFromSnapshot = preferred;
  } else {
    const mdFiles = fs
      .readdirSync(snapshotDir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".md"))
      .map((d) => path.join(snapshotDir, d.name));
    bindingFromSnapshot = mdFiles[0] || null;
  }

  return {
    artifactsDirAbs: snapshotDir,
    bindingMapAbs: bindingFromSnapshot || bindingMapAbs,
    snapshotUsed: true,
    snapshotDir
  };
}

function metricsFromObject(obj) {
  return {
    E: normalizeMetricValue(obj?.E),
    V: normalizeMetricValue(obj?.V),
    S: normalizeMetricValue(obj?.S),
    IC: normalizeMetricValue(obj?.IC),
    TFR: normalizeMetricValue(obj?.TFR)
  };
}

function metricsEqual(a, b) {
  const ka = ["E", "V", "S", "IC", "TFR"];
  for (const k of ka) {
    const av = normalizeMetricValue(a?.[k]);
    const bv = normalizeMetricValue(b?.[k]);
    if (av === null && bv === null) continue;
    if (av !== bv) return false;
  }
  return true;
}

function loadJsonlLines(p) {
  const raw = fs.readFileSync(p, "utf8");
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function loadEventObjects(p) {
  const lines = loadJsonlLines(p);
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      events.push({ _parse_error: true, raw: line });
    }
  }
  return events;
}

function requireCanonV11({ runDir, failOnMetricsMismatch }) {
  const eventLogPath = path.join(runDir, "event_log.jsonl");
  const metricsPath = path.join(runDir, "metrics.json");

  if (!fs.existsSync(eventLogPath)) throw new Error(`Missing event_log.jsonl: ${eventLogPath}`);
  if (!fs.existsSync(metricsPath)) throw new Error(`Missing metrics.json: ${metricsPath}`);

  const lines = loadJsonlLines(eventLogPath);
  if (!lines.length) throw new Error(`Empty event_log.jsonl: ${eventLogPath}`);

  let first;
  try {
    first = JSON.parse(lines[0]);
  } catch {
    throw new Error(`First line of event_log.jsonl is not valid JSON: ${eventLogPath}`);
  }

  if (first?.type !== "META" || typeof first?.ts_unit !== "string" || !first.ts_unit.trim()) {
    throw new Error(`event_log.jsonl first line must be META with ts_unit: ${eventLogPath}`);
  }

  let lastObj = null;
  const warnings = [];
  for (let i = 1; i < lines.length; i++) {
    let obj;
    try {
      obj = JSON.parse(lines[i]);
    } catch {
      throw new Error(`Invalid JSON on line ${i + 1} of event_log.jsonl: ${eventLogPath}`);
    }
    if (!obj || typeof obj !== "object") continue;

    const hasCtx = typeof obj.ctx === "string" && obj.ctx.trim().length > 0;
    const isMetricsCalc = obj.type === "METRICS_CALC";

    if (!hasCtx && isMetricsCalc) {
      warnings.push(`Missing ctx on METRICS_CALC at line ${i + 1} (legacy tolerated).`);
    } else if (!hasCtx) {
      throw new Error(`Missing ctx on line ${i + 1} of event_log.jsonl: ${eventLogPath}`);
    }
    lastObj = obj;
  }

  if (!lastObj || lastObj.type !== "METRICS_CALC") {
    throw new Error(`Last non-empty event must be METRICS_CALC: ${eventLogPath}`);
  }

  const metricsFileObj = readJson(metricsPath);
  const metricsJson = metricsFromObject(metricsFileObj);
  const metricsCalc = metricsFromObject(lastObj);

  const mismatch = !metricsEqual(metricsJson, metricsCalc);
  if (mismatch && failOnMetricsMismatch) {
    throw new Error(`metrics.json does not match latest METRICS_CALC: ${metricsPath}`);
  }

  const events = loadEventObjects(eventLogPath);
  const icComputed = computeIC({ events });
  const icMetricsJsonValue = normalizeMetricValue(metricsFileObj?.IC);
  const icValue = icComputed.ic_value;
  const icMismatch = icValue === null || icMetricsJsonValue === null ? false : Math.abs(icValue - icMetricsJsonValue) > 1e-6;

  return {
    eventLogPath,
    metricsPath,
    metricsCalc,
    metricsJson,
    mismatch,
    warnings,
    ic_computed: icComputed,
    ic_metrics_json_value: icMetricsJsonValue,
    ic_value: icValue,
    ic_mismatch: icMismatch
  };
}

function runCompute({ computeScriptAbs, sideLabel, artifactsDirAbs, runDirAbs, outPathAbs, metricsFileAbs }) {
  const opsPath = path.join(artifactsDirAbs, "operations.json");
  const instructionsPath = path.join(artifactsDirAbs, "instructions.json");
  const procedurePath = path.join(artifactsDirAbs, "procedure.json");
  const eventLogPath = path.join(runDirAbs, "event_log.jsonl");

  const argv = [
    computeScriptAbs,
    "--ops",
    opsPath,
    "--instructions",
    instructionsPath,
    "--procedure",
    procedurePath,
    "--event-log",
    eventLogPath,
    "--metrics-file",
    metricsFileAbs,
    "--out",
    outPathAbs,
    "--label",
    sideLabel
  ];

  const res = spawnSync("node", argv, { encoding: "utf8" });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    const msg = [
      `[wf_cycle_compute_compare_basic] compute script failed for ${sideLabel}`,
      `command: node ${argv.map((a) => JSON.stringify(a)).join(" ")}`,
      `exit_code: ${res.status}`,
      res.stdout || "",
      res.stderr || ""
    ].join("\n");
    throw new Error(msg);
  }
}

function computeDeltaSummary({ leftLabel, rightLabel, left, right, deltaMode }) {
  const metricsKeys = ["E", "V", "S", "IC", "TFR", "score"];
  const diffs = metricsKeys.map((k) => {
    const lv = normalizeMetricValue(left?.[k]);
    const rv = normalizeMetricValue(right?.[k]);
    return { key: k, left: lv, right: rv, delta: lv === null || rv === null ? null : rv - lv };
  });

  const lines = [];
  lines.push("# Delta summary");
  lines.push("");
  lines.push("## Differences in metrics");
  lines.push("");
  for (const d of diffs) {
    const deltaText = d.delta === null ? "n/a" : (d.delta >= 0 ? `+${d.delta}` : `${d.delta}`);
    lines.push(`- ${d.key}: ${leftLabel}=${d.left ?? "null"} vs ${rightLabel}=${d.right ?? "null"} (right-left=${deltaText})`);
  }

  if (deltaMode !== "metrics_only") {
    const rec = [];
    if (normalizeMetricValue(left?.IC) !== null && normalizeMetricValue(right?.IC) !== null) {
      const better = left.IC < right.IC ? leftLabel : rightLabel;
      rec.push(`Adopt ${better}'s ctx discipline to reduce IC (single runs→artifacts→runs cycle).`);
    }
    if (normalizeMetricValue(left?.S) !== null && normalizeMetricValue(right?.S) !== null) {
      const better = left.S > right.S ? leftLabel : rightLabel;
      rec.push(`Adopt ${better}'s stability practices to keep S high (no ID renames after closed loop).`);
    }
    if (normalizeMetricValue(left?.TFR) !== null && normalizeMetricValue(right?.TFR) !== null) {
      const better = left.TFR < right.TFR ? leftLabel : rightLabel;
      rec.push(`Adopt ${better}'s early E proof / METRICS_CALC discipline to reduce TFR.`);
    }

    const unique = Array.from(new Set(rec)).slice(0, 5);
    lines.push("");
    lines.push("## Recommended transfers");
    lines.push("");
    if (!unique.length) {
      lines.push("- (none)");
    } else {
      for (const r of unique) lines.push(`- ${r}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function computeWinner({ leftLabel, rightLabel, scoreLeft, scoreRight }) {
  if (scoreLeft > scoreRight) return leftLabel;
  if (scoreRight > scoreLeft) return rightLabel;
  return leftLabel;
}

function computeScoreValue({ E, V, S, IC }) {
  if (E === null || V === null || S === null) return null;
  const icForLn = IC === null ? 1000 : IC;
  return 0.4 * E + 0.3 * V + 0.3 * S - 0.05 * Math.log(icForLn + 1);
}

function augmentComputed({
  computed,
  canonical,
  icNote = "IC computed from ctx switches (event_log). metrics.json IC is informational."
}) {
  const updated = { ...computed };
  updated.ic_source = "computed_from_event_log";
  updated.ic_value = canonical.ic_value;
  updated.ic_metrics_json_value = canonical.ic_metrics_json_value;
  updated.ic_mismatch = canonical.ic_mismatch;
  updated.ic_note = icNote;
  updated.IC = canonical.ic_value;
  if (
    canonical.ic_computed &&
    canonical.ic_computed.details &&
    typeof canonical.ic_computed.details === "object"
  ) {
    updated.details = { ...(updated.details || {}) };
    updated.details.ic_source_details = canonical.ic_computed.details;
  }

  const E = normalizeMetricValue(updated.E);
  const V = normalizeMetricValue(updated.V);
  const S = normalizeMetricValue(updated.S);
  const icVal = updated.ic_value ?? null;
  const newScore = computeScoreValue({ E, V, S, IC: icVal });
  if (newScore !== null) {
    updated.score = Number(newScore.toFixed(6));
  }
  return updated;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (!args.requestFile) {
    console.error("[wf_cycle_compute_compare_basic] Missing --request-file");
    console.error(usage());
    process.exit(1);
  }

  const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
  const requestPath = path.isAbsolute(args.requestFile)
    ? args.requestFile
    : path.join(repoRoot, args.requestFile);

  const request = readJson(requestPath);

  const options = request.options || {};
  const writeFiles = typeof options.write_files === "boolean" ? options.write_files : true;
  const failOnMismatch = typeof options.fail_on_metrics_mismatch === "boolean" ? options.fail_on_metrics_mismatch : true;
  const deltaMode = options.delta_mode || "basic";

  const computeScriptRel = request.tools?.compute_metrics_script || "wf_formalization_cycle_v1/tools/compute_metrics_from_artifacts.mjs";
  const computeScriptAbs = path.isAbsolute(computeScriptRel) ? computeScriptRel : path.join(repoRoot, computeScriptRel);

  if (!fs.existsSync(computeScriptAbs)) {
    throw new Error(`compute_metrics_script not found: ${computeScriptAbs}`);
  }

  const outputCompareDirAbs = path.isAbsolute(request.output_compare_dir)
    ? request.output_compare_dir
    : path.join(repoRoot, request.output_compare_dir);

  if (outputCompareDirAbs.replace(/\\/g, "/").includes("/lab/memory/")) {
    throw new Error("Refusing to write into lab/memory/**");
  }

  const leftLabel = safeLabel(request.left?.label);
  const rightLabel = safeLabel(request.right?.label);

  const leftRunDirAbs = path.isAbsolute(request.left?.run_dir)
    ? request.left.run_dir
    : path.join(repoRoot, request.left.run_dir);
  const rightRunDirAbs = path.isAbsolute(request.right?.run_dir)
    ? request.right.run_dir
    : path.join(repoRoot, request.right.run_dir);

  const leftBindingMapAbs = path.isAbsolute(request.left?.binding_map_path)
    ? request.left.binding_map_path
    : path.join(repoRoot, request.left.binding_map_path);
  const rightBindingMapAbs = path.isAbsolute(request.right?.binding_map_path)
    ? request.right.binding_map_path
    : path.join(repoRoot, request.right.binding_map_path);

  const leftArtifactsDirInputAbs = path.isAbsolute(request.left?.artifacts_dir)
    ? request.left.artifacts_dir
    : path.join(repoRoot, request.left.artifacts_dir);
  const rightArtifactsDirInputAbs = path.isAbsolute(request.right?.artifacts_dir)
    ? request.right.artifacts_dir
    : path.join(repoRoot, request.right.artifacts_dir);

  const leftResolved = resolveRunSnapshotArtifacts({
    runDirAbs: leftRunDirAbs,
    artifactsDirAbs: leftArtifactsDirInputAbs,
    bindingMapAbs: leftBindingMapAbs
  });
  const rightResolved = resolveRunSnapshotArtifacts({
    runDirAbs: rightRunDirAbs,
    artifactsDirAbs: rightArtifactsDirInputAbs,
    bindingMapAbs: rightBindingMapAbs
  });

  const leftArtifactsDirAbs = leftResolved.artifactsDirAbs;
  const rightArtifactsDirAbs = rightResolved.artifactsDirAbs;
  const leftBindingMapEffectiveAbs = leftResolved.bindingMapAbs;
  const rightBindingMapEffectiveAbs = rightResolved.bindingMapAbs;

  const pathsWritten = [];

  const canonLeft = requireCanonV11({ runDir: leftRunDirAbs, failOnMetricsMismatch: failOnMismatch });
  const canonRight = requireCanonV11({ runDir: rightRunDirAbs, failOnMetricsMismatch: failOnMismatch });

  let pathsStyle = "relative";
  const formatPathLine = (label, absPath) => {
    if (!absPath) return `- ${label}: (not provided)`;
    const normalized = normalizePathForInputs({ repoRoot, inputPath: absPath });
    if (!normalized.relative) pathsStyle = "mixed";
    return `- ${label}: ${normalized.path}${normalized.relative ? "" : " (absolute)"}`;
  };

  const compareDirLine = formatPathLine("compare_dir", outputCompareDirAbs);
  const computeScriptLine = formatPathLine("compute_metrics_script", computeScriptAbs);

  const leftLines = [
    `- label: ${leftLabel}`,
    formatPathLine("run_dir", leftRunDirAbs),
    formatPathLine("artifacts_dir", leftArtifactsDirAbs)
  ];
  if (leftResolved.snapshotUsed) {
    leftLines.push(formatPathLine("artifacts_snapshot_dir", leftResolved.snapshotDir));
  }
  leftLines.push(
    leftBindingMapEffectiveAbs
      ? formatPathLine("binding_map_path", leftBindingMapEffectiveAbs)
      : "- binding_map_path: (not provided)"
  );

  const rightLines = [
    `- label: ${rightLabel}`,
    formatPathLine("run_dir", rightRunDirAbs),
    formatPathLine("artifacts_dir", rightArtifactsDirAbs)
  ];
  if (rightResolved.snapshotUsed) {
    rightLines.push(formatPathLine("artifacts_snapshot_dir", rightResolved.snapshotDir));
  }
  rightLines.push(
    rightBindingMapEffectiveAbs
      ? formatPathLine("binding_map_path", rightBindingMapEffectiveAbs)
      : "- binding_map_path: (not provided)"
  );

  const inputsMd = [
    `# Compare inputs (${request.experiment_id || "unknown"} / ${request.compare_id || "compare"})`,
    "",
    `repo_root: ${repoRoot}`,
    `paths_style: ${pathsStyle}`,
    "",
    compareDirLine,
    computeScriptLine,
    "",
    "## Left",
    "",
    ...leftLines,
    "",
    "## Right",
    "",
    ...rightLines,
    ""
  ].join("\n");

  const inputsPath = path.join(outputCompareDirAbs, "inputs.md");
  const outLeft = path.join(outputCompareDirAbs, `metrics_computed_${leftLabel}.json`);
  const outRight = path.join(outputCompareDirAbs, `metrics_computed_${rightLabel}.json`);
  const scorePath = path.join(outputCompareDirAbs, "score_computed.json");
  const winnerPath = path.join(outputCompareDirAbs, "winner.md");
  const deltaPath = path.join(outputCompareDirAbs, "delta_summary.md");

  if (writeFiles) {
    writeText(inputsPath, inputsMd);
    pathsWritten.push(inputsPath);
  }

  runCompute({
    computeScriptAbs,
    sideLabel: leftLabel,
    artifactsDirAbs: leftArtifactsDirAbs,
    runDirAbs: leftRunDirAbs,
    outPathAbs: outLeft,
    metricsFileAbs: canonLeft.metricsPath
  });
  runCompute({
    computeScriptAbs,
    sideLabel: rightLabel,
    artifactsDirAbs: rightArtifactsDirAbs,
    runDirAbs: rightRunDirAbs,
    outPathAbs: outRight,
    metricsFileAbs: canonRight.metricsPath
  });

  let leftComputed = readJson(outLeft);
  let rightComputed = readJson(outRight);
  leftComputed = augmentComputed({ computed: leftComputed, canonical: canonLeft });
  rightComputed = augmentComputed({ computed: rightComputed, canonical: canonRight });
  if (writeFiles) {
    writeJson(outLeft, leftComputed);
    writeJson(outRight, rightComputed);
    pathsWritten.push(outLeft, outRight);
  }

  const leftScoreValue = normalizeMetricValue(leftComputed?.score) ?? 0;
  const rightScoreValue = normalizeMetricValue(rightComputed?.score) ?? 0;

  const winnerLabel = computeWinner({
    leftLabel,
    rightLabel,
    scoreLeft: leftScoreValue,
    scoreRight: rightScoreValue
  });

  const scoreObj = {
    computed_at: new Date().toISOString(),
    formula: "Score = 0.4*E + 0.3*V + 0.3*S - 0.05*ln(IC+1)",
    compared: request.compare_id || null,
    winner: winnerLabel
  };
  scoreObj[leftLabel] = {
    score: leftScoreValue,
    E: normalizeMetricValue(leftComputed?.E),
    V: normalizeMetricValue(leftComputed?.V),
    S: normalizeMetricValue(leftComputed?.S),
    IC: leftComputed?.ic_value ?? null,
    ic_value: leftComputed?.ic_value ?? null,
    ic_metrics_json_value: leftComputed?.ic_metrics_json_value ?? null,
    ic_source: leftComputed?.ic_source ?? "computed_from_event_log",
    ic_mismatch: Boolean(leftComputed?.ic_mismatch),
    TFR: normalizeMetricValue(leftComputed?.TFR),
    selected_procedure_id: leftComputed?.selected_procedure?.id ?? null
  };
  scoreObj[rightLabel] = {
    score: rightScoreValue,
    E: normalizeMetricValue(rightComputed?.E),
    V: normalizeMetricValue(rightComputed?.V),
    S: normalizeMetricValue(rightComputed?.S),
    IC: rightComputed?.ic_value ?? null,
    ic_value: rightComputed?.ic_value ?? null,
    ic_metrics_json_value: rightComputed?.ic_metrics_json_value ?? null,
    ic_source: rightComputed?.ic_source ?? "computed_from_event_log",
    ic_mismatch: Boolean(rightComputed?.ic_mismatch),
    TFR: normalizeMetricValue(rightComputed?.TFR),
    selected_procedure_id: rightComputed?.selected_procedure?.id ?? null
  };

  const warnings = [...(canonLeft.warnings || []), ...(canonRight.warnings || [])];
  if (canonLeft.ic_mismatch) {
    warnings.push(
      `${leftLabel}: IC drift — metrics.json IC (${canonLeft.ic_metrics_json_value ?? "null"}) differs from event_log IC (${canonLeft.ic_value ?? "null"}); using ic_value from event_log.`
    );
  }
  if (canonRight.ic_mismatch) {
    warnings.push(
      `${rightLabel}: IC drift — metrics.json IC (${canonRight.ic_metrics_json_value ?? "null"}) differs from event_log IC (${canonRight.ic_value ?? "null"}); using ic_value from event_log.`
    );
  }

  const winnerMdBase = [
    `# Winner (${request.compare_id || "compare"})`,
    "",
    `Winner: \`${winnerLabel}\``,
    "",
    "Computed scores:",
    "",
    `- ${leftLabel}: score=${leftScoreValue}`,
    `- ${rightLabel}: score=${rightScoreValue}`,
    "",
    "Primary driver (heuristic): compare `IC`, `S`, and `TFR` deltas to explain the win."
  ];
  if (warnings.length) {
    winnerMdBase.push("", "Warnings:", "", ...warnings.map((w) => `- ${w}`));
  }
  const winnerMd = winnerMdBase.join("\n");

  const deltaMd = computeDeltaSummary({
    leftLabel,
    rightLabel,
    left: {
      E: leftComputed?.E,
      V: leftComputed?.V,
      S: leftComputed?.S,
      IC: leftComputed?.IC,
      TFR: leftComputed?.TFR,
      score: leftComputed?.score
    },
    right: {
      E: rightComputed?.E,
      V: rightComputed?.V,
      S: rightComputed?.S,
      IC: rightComputed?.IC,
      TFR: rightComputed?.TFR,
      score: rightComputed?.score
    },
    deltaMode
  });

  if (writeFiles) {
    writeJson(scorePath, scoreObj);
    writeText(winnerPath, winnerMd);
    writeText(deltaPath, deltaMd);
    pathsWritten.push(scorePath, winnerPath, deltaPath);
  }

  if (leftResolved.snapshotUsed) warnings.push("Left: using runs/<run>/artifacts_snapshot as artifacts/bindings source.");
  if (rightResolved.snapshotUsed) warnings.push("Right: using runs/<run>/artifacts_snapshot as artifacts/bindings source.");

  const leftSummary = {
    label: leftLabel,
    score: leftScoreValue,
    E: normalizeMetricValue(leftComputed?.E),
    V: normalizeMetricValue(leftComputed?.V),
    S: normalizeMetricValue(leftComputed?.S),
    IC: leftComputed?.ic_value ?? null,
    TFR: normalizeMetricValue(leftComputed?.TFR)
  };
  const rightSummary = {
    label: rightLabel,
    score: rightScoreValue,
    E: normalizeMetricValue(rightComputed?.E),
    V: normalizeMetricValue(rightComputed?.V),
    S: normalizeMetricValue(rightComputed?.S),
    IC: rightComputed?.ic_value ?? null,
    TFR: normalizeMetricValue(rightComputed?.TFR)
  };
  const metricsSummary = { left: leftSummary, right: rightSummary };
  const winnerReason =
    winnerLabel === leftLabel
      ? `${leftLabel} score ${leftScoreValue} >= ${rightLabel} score ${rightScoreValue}`
      : `${rightLabel} score ${rightScoreValue} > ${leftLabel} score ${leftScoreValue}`;
  const winnerObj = { label: winnerLabel, reason: winnerReason };

  const result = {
    status: "ok",
    winner_label: winnerLabel,
    score: scoreObj,
    paths_written: writeFiles ? pathsWritten : [],
    warnings,
    metrics_summary: metricsSummary,
    winner: winnerObj,
    notes:
      "Computed deterministically with wf_cycle v1.1 canon checks; no lab/memory writes." +
      (warnings.length ? ` Warnings: ${warnings.join(" ")}` : "")
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

try {
  main();
} catch (e) {
  const msg = e && typeof e === "object" && "message" in e ? e.message : String(e);
  const result = {
    status: "error",
    winner_label: null,
    score: null,
    paths_written: [],
    warnings: [],
    notes: msg
  };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(1);
}
