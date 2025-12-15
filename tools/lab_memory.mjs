#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const memoryDir = path.join(repoRoot, "lab", "memory");
const sqlitePath = path.join(memoryDir, "lab_memory.sqlite");
const defaultQueryLimit = 20;

const publicMirror =
  repoRoot.toLowerCase().includes("_public") ||
  repoRoot.toLowerCase().endsWith("mova_skill_lab_public");

let sqlInitPromise;

function log(message) {
  console.log(`[lab:memory] ${message}`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toPosix(relPath) {
  return relPath.replace(/\\/g, "/");
}

function stamp() {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
    date.getHours()
  )}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

async function getSqlModule() {
  if (!sqlInitPromise) {
    const initSqlJs = (await import("sql.js")).default;
    sqlInitPromise = initSqlJs({
      locateFile: (fileName) => path.join(repoRoot, "node_modules", "sql.js", "dist", fileName)
    });
  }
  return sqlInitPromise;
}

async function openDatabase() {
  const SQL = await getSqlModule();
  if (fs.existsSync(sqlitePath)) {
    const data = fs.readFileSync(sqlitePath);
    const db = new SQL.Database(data);
    ensureSchema(db);
    return db;
  }

  ensureDir(memoryDir);
  const db = new SQL.Database();
  ensureSchema(db);
  return db;
}

function persistDatabase(db) {
  ensureDir(memoryDir);
  const buffer = Buffer.from(db.export());
  fs.writeFileSync(sqlitePath, buffer);
}

function ensureSchema(db) {
  db.exec(
    `
    CREATE TABLE IF NOT EXISTS episodes (
      id TEXT PRIMARY KEY,
      ts TEXT,
      skill_id TEXT,
      title TEXT,
      tags TEXT,
      summary TEXT,
      ref_path TEXT
    );
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      ts TEXT,
      skill_id TEXT,
      title TEXT,
      tags TEXT,
      summary TEXT,
      ref_path TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_episodes_ts ON episodes(ts);
    CREATE INDEX IF NOT EXISTS idx_episodes_skill ON episodes(skill_id);
    CREATE INDEX IF NOT EXISTS idx_decisions_ts ON decisions(ts);
  `
  );
}

function collectJsonFiles(baseDir) {
  const files = [];
  if (!fs.existsSync(baseDir)) return files;
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function safeParseJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    log(`WARN: Failed to parse ${toPosix(path.relative(repoRoot, filePath))}: ${err.message}`);
    return null;
  }
}

function readStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function resolvePathValue(obj, keyPath) {
  if (!obj) return null;
  const keys = keyPath.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return null;
    current = current[key];
  }
  return current;
}

function firstString(obj, keys) {
  for (const key of keys) {
    const value = resolvePathValue(obj, key);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function deriveSummary(payload) {
  const summaryKeys = [
    "summary",
    "result.summary",
    "result.log",
    "log",
    "notes",
    "description",
    "details"
  ];
  const summary = firstString(payload, summaryKeys);
  if (summary) return truncate(summary, 480);

  if (payload && typeof payload === "object") {
    const trimmed = JSON.stringify(payload);
    return truncate(trimmed, 480);
  }
  return "";
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 3)}...`;
}

function deriveTimestamp(payload, stats) {
  const keys = [
    "ts",
    "timestamp",
    "created_at",
    "createdAt",
    "updated_at",
    "updatedAt",
    "event_ts",
    "eventTs",
    "start_ts",
    "end_ts",
    "metadata.ts"
  ];
  for (const key of keys) {
    const raw = resolvePathValue(payload, key);
    const parsed = normalizeTimestamp(raw);
    if (parsed) return parsed;
  }
  if (stats) return stats.mtime.toISOString();
  return new Date().toISOString();
}

function normalizeTimestamp(value) {
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const source = value < 1e12 ? value * 1000 : value;
    const date = new Date(source);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function deriveSkillId(relPath, payload) {
  const pathParts = toPosix(relPath).split("/");
  const idx = pathParts.indexOf("skills");
  if (idx >= 0 && idx + 1 < pathParts.length) {
    return `skill.${pathParts[idx + 1]}`;
  }
  const field =
    payload?.skill_id ||
    payload?.skillId ||
    payload?.skill ||
    resolvePathValue(payload, "meta.skill_id") ||
    resolvePathValue(payload, "metadata.skill_id");
  if (typeof field === "string" && field.trim()) return field.trim();
  return null;
}

function deriveTags(payload) {
  const tags = payload?.tags || resolvePathValue(payload, "meta.tags");
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => (typeof tag === "string" ? tag.trim() : String(tag)))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof tags === "string") return tags.trim();
  return null;
}

function computeId(payload, relPath, stats) {
  if (typeof payload?.id === "string" && payload.id.trim()) return payload.id.trim();
  if (typeof payload?.episode_id === "string" && payload.episode_id.trim()) {
    return payload.episode_id.trim();
  }
  return crypto
    .createHash("sha1")
    .update(relPath)
    .update(stats ? String(stats.size) : "")
    .update(stats ? String(stats.mtimeMs) : "")
    .digest("hex");
}

function buildEpisodes() {
  const skillsDir = path.join(repoRoot, "skills");
  if (!fs.existsSync(skillsDir)) return [];
  const episodes = [];
  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const skill of skillDirs) {
    const epDir = path.join(skillsDir, skill.name, "episodes");
    const files = collectJsonFiles(epDir);
    for (const filePath of files) {
      const payload = safeParseJson(filePath);
      if (!payload) continue;
      const relPath = toPosix(path.relative(repoRoot, filePath));
      const stats = readStat(filePath);
      episodes.push({
        type: "episode",
        relPath,
        data: payload,
        stats
      });
    }
  }
  return episodes;
}

function buildDecisions() {
  const decisionsDir = path.join(repoRoot, "lab", "decisions");
  if (!fs.existsSync(decisionsDir)) return [];
  return collectJsonFiles(decisionsDir).map((filePath) => {
    const payload = safeParseJson(filePath);
    if (!payload) return null;
    return {
      type: "decision",
      relPath: toPosix(path.relative(repoRoot, filePath)),
      data: payload,
      stats: readStat(filePath)
    };
  }).filter(Boolean);
}

function mapRecord(entry) {
  const { data, relPath, stats, type } = entry;
  return {
    id: computeId(data, relPath, stats),
    ts: deriveTimestamp(data, stats),
    skill_id: type === "episode" ? deriveSkillId(relPath, data) : data?.skill_id || null,
    title: firstString(data, ["title", "name", "summary", "result.title"]) || path.basename(relPath),
    tags: deriveTags(data),
    summary: deriveSummary(data),
    ref_path: relPath,
    type
  };
}

async function handleInit() {
  if (publicMirror) {
    log("SKIP: public mirror does not host SQLite memory.");
    return;
  }
  const db = await openDatabase();
  persistDatabase(db);
  db.close();
  log(`SQLite memory ready at ${toPosix(path.relative(repoRoot, sqlitePath))}`);
}

async function handleImport() {
  if (publicMirror) {
    log("SKIP: public mirror does not host SQLite memory.");
    return;
  }
  const db = await openDatabase();
  const episodeEntries = buildEpisodes().map(mapRecord);
  const decisionEntries = buildDecisions().map(mapRecord);

  const insertEpisode = db.prepare(
    `
    INSERT INTO episodes (id, ts, skill_id, title, tags, summary, ref_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      ts=excluded.ts,
      skill_id=excluded.skill_id,
      title=excluded.title,
      tags=excluded.tags,
      summary=excluded.summary,
      ref_path=excluded.ref_path;
  `
  );
  for (const record of episodeEntries) {
    insertEpisode.run([
      record.id,
      record.ts,
      record.skill_id || null,
      record.title || null,
      record.tags || null,
      record.summary || null,
      record.ref_path
    ]);
  }
  insertEpisode.free();

  const insertDecision = db.prepare(
    `
    INSERT INTO decisions (id, ts, skill_id, title, tags, summary, ref_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      ts=excluded.ts,
      skill_id=excluded.skill_id,
      title=excluded.title,
      tags=excluded.tags,
      summary=excluded.summary,
      ref_path=excluded.ref_path;
  `
  );
  for (const record of decisionEntries) {
    insertDecision.run([
      record.id,
      record.ts,
      record.skill_id || null,
      record.title || null,
      record.tags || null,
      record.summary || null,
      record.ref_path
    ]);
  }
  insertDecision.free();

  persistDatabase(db);
  db.close();
  log(`Import complete: ${episodeEntries.length} episodes, ${decisionEntries.length} decisions indexed.`);
}

function writeSkipContext(outDir, reason) {
  ensureDir(outDir);
  const summary = {
    status: "skipped",
    reason
  };
  fs.writeFileSync(path.join(outDir, "context_restore.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(
    path.join(outDir, "context_restore.md"),
    `# Context Restore\n\n${reason}\n`
  );
}

async function handleQuery(options) {
  const queryText = options.query?.trim() || "";
  const limit = Number(options.limit) > 0 ? Number(options.limit) : defaultQueryLimit;
  const outDir = options.out
    ? path.isAbsolute(options.out)
      ? options.out
      : path.join(repoRoot, options.out)
    : path.join(repoRoot, "lab", "memory", "query_runs", stamp());
  ensureDir(outDir);

  if (publicMirror) {
    log("SKIP: public mirror does not host SQLite memory.");
    writeSkipContext(outDir, "SKIP (public mirror): SQLite memory not available.");
    return;
  }

  if (!fs.existsSync(sqlitePath)) {
    writeSkipContext(outDir, "SKIP: lab/memory/lab_memory.sqlite not initialized.");
    log("SKIP query: SQLite memory missing. Run lab:memory:init + import first.");
    return;
  }

  const SQL = await getSqlModule();
  const data = fs.readFileSync(sqlitePath);
  const db = new SQL.Database(data);

  const likeValue = `%${queryText.toLowerCase()}%`;
  const hasFilter = Boolean(queryText);
  const whereClause = hasFilter
    ? "WHERE (LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(skill_id) LIKE ?)"
    : "";
  const sql = `
    SELECT 'episode' AS kind, id, ts, skill_id, title, tags, summary, ref_path
    FROM episodes
    ${whereClause}
    UNION ALL
    SELECT 'decision' AS kind, id, ts, skill_id, title, tags, summary, ref_path
    FROM decisions
    ${whereClause}
    ORDER BY ts DESC
    LIMIT ${limit};
  `;
  const stmt = db.prepare(sql);
  if (hasFilter) {
    stmt.bind([likeValue, likeValue, likeValue, likeValue, likeValue, likeValue, likeValue, likeValue]);
  }

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  db.close();

  const summary = {
    status: "ok",
    query: queryText || "(all)",
    limit,
    rows
  };
  fs.writeFileSync(path.join(outDir, "context_restore.json"), JSON.stringify(summary, null, 2));

  const mdLines = ["# Context Restore", `Query: \`${queryText || "(all)"}\``, ""];
  if (!rows.length) {
    mdLines.push("No matching rows.");
  } else {
    mdLines.push("| ts | kind | skill_id | title | ref_path |");
    mdLines.push("| --- | --- | --- | --- | --- |");
    rows.forEach((row) => {
      mdLines.push(
        `| ${row.ts || ""} | ${row.kind} | ${row.skill_id || ""} | ${escapeMd(row.title || "")} | ${
          row.ref_path || ""
        } |`
      );
    });
  }
  mdLines.push("");
  fs.writeFileSync(path.join(outDir, "context_restore.md"), mdLines.join("\n"));
  log(`Query wrote ${rows.length} rows to ${toPosix(path.relative(repoRoot, outDir))}`);
}

function escapeMd(text) {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token) continue;
    if (token === "--query") args.query = argv[++i];
    else if (token === "--limit") args.limit = argv[++i];
    else if (token === "--out") args.out = argv[++i];
    else if (token === "--help" || token === "-h") args.help = true;
  }
  return args;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") {
    console.log(
      [
        "Usage:",
        "  node tools/lab_memory.mjs init",
        "  node tools/lab_memory.mjs import",
        "  node tools/lab_memory.mjs query [--query <text>] [--limit 20] [--out <dir>]",
        "",
        "Commands:",
        "  init   Initialize lab/memory/lab_memory.sqlite with canonical schema.",
        "  import Scan tracked episodes/decisions and index them into SQLite.",
        "  query  Run LIKE search across memory and emit context_restore.{json,md}."
      ].join("\n")
    );
    return;
  }

  if (command === "init") {
    await handleInit();
    return;
  }
  if (command === "import") {
    await handleImport();
    return;
  }
  if (command === "query") {
    const args = parseArgs(rest);
    await handleQuery(args);
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

main().catch((err) => {
  console.error(`[lab:memory] ERROR ${err.stack || err.message || err}`);
  process.exitCode = 1;
});

