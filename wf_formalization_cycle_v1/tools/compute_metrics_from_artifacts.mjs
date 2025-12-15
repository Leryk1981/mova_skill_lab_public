import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--ops") args.ops = argv[++i];
    else if (k === "--instructions") args.instructions = argv[++i];
    else if (k === "--procedure") args.procedure = argv[++i];
    else if (k === "--event-log") args.eventLog = argv[++i];
    else if (k === "--metrics-file") args.metricsFile = argv[++i];
    else if (k === "--out") args.out = argv[++i];
    else if (k === "--label") args.label = argv[++i];
    else if (k === "--help" || k === "-h") args.help = true;
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node lab/experiments/WF_EX_WF_BUILD_WORKFLOW_001/rules/compute_metrics_from_artifacts.mjs \\",
    "    --ops <operations.json> --instructions <instructions.json> --procedure <procedure.json> \\",
    "    --event-log <event_log.jsonl> --out <metrics_computed.json> [--label <string>]",
    ""
  ].join("\n");
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function safeReadLines(p) {
  if (!p || !fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf8");
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseJsonl(p) {
  const lines = safeReadLines(p);
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

function findMeta(events) {
  for (const e of events) {
    if (!e || typeof e !== "object" || e._parse_error) continue;
    if (e.type === "META" && typeof e.ts_unit === "string" && e.ts_unit.trim().length > 0) {
      return { ts_unit: e.ts_unit, raw: e };
    }
  }
  return null;
}

function findLatestMetricsCalc(events) {
  let last = null;
  for (const e of events) {
    if (!e || typeof e !== "object" || e._parse_error) continue;
    if (e.type === "METRICS_CALC") last = e;
  }
  return last;
}

function normalizeMetricValue(v) {
  if (v === null || typeof v === "undefined") return null;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function metricDiff(a, b, eps = 1e-9) {
  if (a === null && b === null) return { ok: true, delta: null };
  if (a === null || b === null) return { ok: false, delta: null };
  const d = Math.abs(a - b);
  return { ok: d <= eps, delta: d };
}

function requireEvidenceConsistency({ events, metricsFilePath }) {
  const meta = findMeta(events);
  if (!meta) {
    throw new Error('Missing META line with ts_unit (expected: {"type":"META","ts_unit":"s"} as first logical record).');
  }

  const metricsCalc = findLatestMetricsCalc(events);
  if (!metricsCalc) {
    throw new Error("Missing METRICS_CALC event in event_log.jsonl.");
  }

  if (!metricsFilePath) {
    return { meta, metricsCalc, metricsFile: null, consistency: null };
  }

  if (!fs.existsSync(metricsFilePath)) {
    throw new Error(`metrics.json not found: ${metricsFilePath}`);
  }

  const metricsFile = loadJson(metricsFilePath);

  const keys = ["E", "V", "S", "IC", "TFR"];
  const diffs = [];

  for (const k of keys) {
    const a = normalizeMetricValue(metricsCalc[k]);
    const b = normalizeMetricValue(metricsFile[k]);
    const d = metricDiff(a, b);
    if (!d.ok) diffs.push({ key: k, metrics_calc: a, metrics_json: b, abs_delta: d.delta });
  }

  if (diffs.length) {
    throw new Error(
      "METRICS_CALC values do not match metrics.json:\n" + diffs.map((x) => JSON.stringify(x)).join("\n")
    );
  }

  return { meta, metricsCalc, metricsFile, consistency: { ok: true } };
}

function indexBy(array, keyField) {
  const m = new Map();
  for (const item of array || []) {
    const k = item?.[keyField];
    if (typeof k === "string" && k.length) m.set(k, item);
  }
  return m;
}

function inferRunFlavorFromEventLogPath(eventLogPath) {
  if (typeof eventLogPath !== "string") return null;
  const p = eventLogPath.replace(/\\/g, "/").toLowerCase();
  if (p.includes("/runs/a_spiral/")) return "spiral";
  if (p.includes("/runs/b_topdown/")) return "topdown";
  if (p.includes("/runs/c_bottomup/")) return "bottomup";
  return null;
}

function pickProcedureForRun(proceduresBundle, eventLogPath) {
  const items = Array.isArray(proceduresBundle?.items) ? proceduresBundle.items : [];
  const byId = items.filter((p) => typeof p?.id === "string");
  const runFlavor = inferRunFlavorFromEventLogPath(eventLogPath);

  const matchByFlavor =
    runFlavor &&
    (byId.find((p) => p.id.toLowerCase().includes(runFlavor)) ||
      byId.find((p) => p.name?.toLowerCase().includes(runFlavor)));

  const spiralFallback =
    byId.find((p) => p.id.toLowerCase().includes("spiral")) ||
    byId.find((p) => p.name?.toLowerCase().includes("spiral"));

  return matchByFlavor || spiralFallback || byId[0] || null;
}

function computeE({ procedure, instructionsById, opsById }) {
  const nodes = Array.isArray(procedure?.nodes) ? procedure.nodes : [];
  const instructionNodes = nodes.filter((n) => n?.kind === "instruction");

  if (!instructionNodes.length) return { E: 0, details: { denominator_instruction_nodes: 0, bound: 0 } };

  let bound = 0;
  const unbound = [];

  for (const n of instructionNodes) {
    const instrId = n?.instr_ref;
    const instr = typeof instrId === "string" ? instructionsById.get(instrId) : null;
    const steps = Array.isArray(instr?.steps) ? instr.steps : null;
    const nodeId = typeof n?.node_id === "string" ? n.node_id : "(no_node_id)";

    if (!instrId || !instr || !steps || !steps.length) {
      unbound.push({ node_id: nodeId, instr_ref: instrId || null, reason: "missing_instruction_or_steps" });
      continue;
    }

    const missingOps = [];
    for (const s of steps) {
      const opRef = s?.op_ref;
      if (typeof opRef !== "string" || !opsById.has(opRef)) missingOps.push(opRef || null);
    }

    if (missingOps.length) {
      unbound.push({ node_id: nodeId, instr_ref: instrId, reason: "missing_op_refs", missing_op_refs: missingOps });
      continue;
    }

    bound += 1;
  }

  return {
    E: bound / instructionNodes.length,
    details: { denominator_instruction_nodes: instructionNodes.length, bound_instruction_nodes: bound, unbound }
  };
}

function isFormalCriterion(expr) {
  if (typeof expr !== "string") return false;
  const s = expr.trim();
  if (!s) return false;
  const hasOps = /[<>=!]=|[<>]/.test(s);
  const hasBool = /\b(true|false)\b/i.test(s) || /&&|\|\|/.test(s);
  const hasIdentifier = /[a-zA-Z_][a-zA-Z0-9_.]*/.test(s);
  return hasIdentifier && (hasOps || hasBool);
}

function computeV({ procedure, ops }) {
  const nodes = Array.isArray(procedure?.nodes) ? procedure.nodes : [];
  const edges = Array.isArray(procedure?.edges) ? procedure.edges : [];
  const opItems = Array.isArray(ops?.items) ? ops.items : [];

  const criteria = [];

  for (const n of nodes) {
    if (n?.kind === "gateway") {
      const rule = n?.rule ?? null;
      if (typeof rule === "string") criteria.push({ source: "gateway.rule", expr: rule });
    }
  }

  for (const e of edges) {
    if (typeof e?.condition === "string") criteria.push({ source: "edge.condition", expr: e.condition });
  }

  for (const op of opItems) {
    const hasErrors = Array.isArray(op?.errors) && op.errors.length > 0;
    const hasTest = typeof op?.test?.type === "string" && op.test.type.length > 0;

    const hasFailConditions = Array.isArray(op?.fail_conditions) && op.fail_conditions.length > 0;
    const hasPassFail = typeof op?.pass_fail === "string" && op.pass_fail.trim().length > 0;

    criteria.push({
      source: "operation.contract",
      has_errors: hasErrors,
      has_test: hasTest,
      has_fail_conditions: hasFailConditions,
      has_pass_fail: hasPassFail
    });
  }

  if (!criteria.length) return { V: 0, details: { total_criteria: 0, formal_criteria: 0 } };

  let formal = 0;
  const nonformal = [];

  for (const c of criteria) {
    if (c.source === "operation.contract") {
      const ok =
        (c.has_errors && c.has_test) ||
        (c.has_fail_conditions && c.has_pass_fail) ||
        c.has_pass_fail;
      if (ok) formal += 1;
      else nonformal.push(c);
      continue;
    }
    if (isFormalCriterion(c.expr)) formal += 1;
    else nonformal.push(c);
  }

  return { V: formal / criteria.length, details: { total_criteria: criteria.length, formal_criteria: formal, nonformal } };
}

function churnPoints(evt) {
  const kind = String(evt?.event || evt?.type || "").toUpperCase();
  if (kind !== "DEF_EDIT" && kind !== "DEF_RENAME") return 0;
  const changeType = String(evt?.change_type || "").toLowerCase();
  if (changeType === "rename" || kind === "DEF_RENAME") return 1.0;
  if (changeType === "structural") return 0.5;
  if (changeType === "logic") return 0.25;
  return 0.1;
}

function computeS({ events }) {
  const points = events.reduce((acc, e) => acc + churnPoints(e), 0);
  const S = Math.max(0, 1 - points / 5);
  return {
    S,
    details: {
      churn_points: points,
      model: "S = max(0, 1 - churn_points/5), churn_points weights: rename=1, structural=0.5, logic=0.25, edit=0.1"
    }
  };
}

function computeICandTFR({ events }) {
  const usable = events.filter((e) => e && typeof e === "object" && !e._parse_error).filter((e) => typeof e.ts === "number");
  const meta = events.find((e) => e && typeof e === "object" && e.type === "META" && typeof e.ts_unit === "string") || null;

  if (!usable.length) {
    return {
      IC: null,
      TFR: null,
      details: { meta, note: "No numeric ts found; IC/TFR are null." }
    };
  }

  const sorted = usable.slice().sort((a, b) => a.ts - b.ts);
  const firstTs = sorted[0].ts;
  const lastTs = sorted[sorted.length - 1].ts;
  const spanSec = lastTs - firstTs;

  const ctxs = sorted
    .map((e) => (typeof e.ctx === "string" ? e.ctx : null))
    .filter((v) => v !== null);

  let switches = 0;
  let prev = null;
  for (const c of ctxs) {
    if (prev && c !== prev) switches += 1;
    prev = c;
  }

  const IC = spanSec > 0 ? (switches / spanSec) * 3600 : null;

  const firstOpStart = sorted.find((e) => e.type === "OP_START" || e.event === "OP_START") || null;
  const t0 = firstOpStart?.ts ?? firstTs;

  const eProof = sorted.find((e) => e.type === "E_PROOF" && typeof e.E === "number" && e.E >= 0.5) || null;
  const metricsCalc = sorted.find((e) => e.type === "METRICS_CALC" && typeof e.E === "number" && e.E >= 0.5) || null;
  const tProof = (eProof?.ts ?? metricsCalc?.ts) ?? null;

  const TFR = tProof === null ? null : (tProof - t0) / 60;

  return {
    IC: IC === null ? null : Number(IC.toFixed(4)),
    TFR: TFR === null ? null : Number(TFR.toFixed(2)),
    details: {
      meta,
      ts_unit: meta?.ts_unit ?? "unknown",
      ctx_switches: switches,
      span_sec: spanSec,
      first_op_start_ts: t0,
      first_e_proof_ts: eProof?.ts ?? null,
      first_metrics_calc_ts: metricsCalc?.ts ?? null
    }
  };
}

function ln(x) {
  return Math.log(x);
}

function computeScore({ E, V, S, IC }) {
  const icForLn = IC === null ? 1000 : IC;
  return 0.4 * E + 0.3 * V + 0.3 * S - 0.05 * ln(icForLn + 1);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  const required = ["ops", "instructions", "procedure", "eventLog", "out"];
  for (const k of required) {
    if (!args[k]) {
      console.error(`[compute_metrics] Missing --${k === "eventLog" ? "event-log" : k}`);
      console.log(usage());
      process.exit(1);
    }
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.join(scriptDir, "..", "..", "..", "..");
  const resolve = (p) => (path.isAbsolute(p) ? p : path.join(repoRoot, p));

  const opsPath = resolve(args.ops);
  const instrPath = resolve(args.instructions);
  const procPath = resolve(args.procedure);
  const logPath = resolve(args.eventLog);
  const metricsFilePath = args.metricsFile ? resolve(args.metricsFile) : null;
  const outPath = resolve(args.out);

  const ops = loadJson(opsPath);
  const instructions = loadJson(instrPath);
  const procedures = loadJson(procPath);
  const events = parseJsonl(logPath);

  const evidence = requireEvidenceConsistency({ events, metricsFilePath });

  const instructionsById = indexBy(instructions?.items || [], "instr_id");
  const opsById = indexBy(ops?.items || [], "op_id");
  const procedure = pickProcedureForRun(procedures, args.eventLog);

  const Eres = computeE({ procedure, instructionsById, opsById });
  const Vres = computeV({ procedure, ops });
  const Sres = computeS({ events });
  const ic = computeICandTFR({ events });

  const E = Number(Eres.E.toFixed(4));
  const V = Number(Vres.V.toFixed(4));
  const S = Number(Sres.S.toFixed(4));
  const IC = ic.IC;
  const TFR = ic.TFR;
  const score = Number(computeScore({ E, V, S, IC }).toFixed(6));

  const evidenceMetrics = evidence.metricsFile
    ? {
        E: normalizeMetricValue(evidence.metricsFile.E),
        V: normalizeMetricValue(evidence.metricsFile.V),
        S: normalizeMetricValue(evidence.metricsFile.S),
        IC: normalizeMetricValue(evidence.metricsFile.IC),
        TFR: normalizeMetricValue(evidence.metricsFile.TFR)
      }
    : null;

  const metricsCalcMetrics = evidence.metricsCalc
    ? {
        E: normalizeMetricValue(evidence.metricsCalc.E),
        V: normalizeMetricValue(evidence.metricsCalc.V),
        S: normalizeMetricValue(evidence.metricsCalc.S),
        IC: normalizeMetricValue(evidence.metricsCalc.IC),
        TFR: normalizeMetricValue(evidence.metricsCalc.TFR)
      }
    : null;

  const out = {
    computed_at: new Date().toISOString(),
    label: args.label || null,
    selected_procedure: procedure ? { id: procedure.id || null, name: procedure.name || null } : null,
    evidence: {
      meta: evidence.meta,
      metrics_calc: metricsCalcMetrics,
      metrics_json: evidenceMetrics,
      metrics_calc_equals_metrics_json: evidence.consistency?.ok ?? null
    },
    E,
    V,
    S,
    IC,
    TFR,
    score,
    details: {
      E: Eres.details,
      V: Vres.details,
      S: Sres.details,
      IC_TFR: ic.details
    }
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
}

main().catch((err) => {
  console.error("[compute_metrics] Error:", err?.stack || err?.message || String(err));
  process.exit(1);
});
