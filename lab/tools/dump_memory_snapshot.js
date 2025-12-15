#!/usr/bin/env node

/**
 * Dump a compact snapshot of SQLite memory (episodes + decisions) into JSON.
 * Uses sql.js (pure JS) and reads lab/memory/skills_lab_memory.sqlite.
 */

const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const ROOT = path.join(__dirname, "..", "..");
const DB_PATH = path.join(ROOT, "lab", "memory", "skills_lab_memory.sqlite");
const OUTPUT_DIR = path.join(ROOT, "lab", "memory");

function ensureDbExists() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(
      `[memory:snapshot] DB not found at ${DB_PATH}. Run "npm run init:memory" and "npm run memory:import" first.`
    );
    process.exit(1);
  }
}

function fmt(ts = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    ts.getFullYear() +
    pad(ts.getMonth() + 1) +
    pad(ts.getDate()) +
    "_" +
    pad(ts.getHours()) +
    pad(ts.getMinutes()) +
    pad(ts.getSeconds())
  );
}

async function main() {
  ensureDbExists();

  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));

  const queryAll = (sql, params = []) => {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  };

  const tagsToArray = (tags) =>
    tags && typeof tags === "string"
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  // Totals
  const episodesTotal = queryAll("SELECT COUNT(*) as count FROM episodes")[0]?.count || 0;
  const decisionsTotal = queryAll("SELECT COUNT(*) as count FROM decisions")[0]?.count || 0;

  const episodesBySkill = queryAll(
    "SELECT skill_id, COUNT(*) as count FROM episodes GROUP BY skill_id ORDER BY count DESC"
  ).map((r) => ({
    skill_id: r.skill_id || null,
    count: r.count
  }));

  const episodesByEnvelope = queryAll(
    "SELECT envelope_id, COUNT(*) as count FROM episodes GROUP BY envelope_id ORDER BY count DESC LIMIT 10"
  ).map((r) => ({
    envelope_id: r.envelope_id || null,
    count: r.count
  }));

  const episodesLatest = queryAll(
    "SELECT id, created_at, envelope_id, skill_id, summary, tags FROM episodes ORDER BY datetime(created_at) DESC LIMIT 10"
  ).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    envelope_id: r.envelope_id || null,
    skill_id: r.skill_id || null,
    summary: r.summary || null,
    tags: tagsToArray(r.tags)
  }));

  const decisionsByScope = queryAll(
    "SELECT context_scope, COUNT(*) as count FROM decisions GROUP BY context_scope ORDER BY count DESC"
  ).map((r) => ({
    context_scope: r.context_scope || null,
    count: r.count
  }));

  const decisionsLatest = queryAll(
    "SELECT id, created_at, title, tags FROM decisions ORDER BY datetime(created_at) DESC LIMIT 10"
  ).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    title: r.title || null,
    tags: tagsToArray(r.tags)
  }));

  const now = new Date();
  const snapshotId = `sqlite_memory_${fmt(now)}`;
  const snapshot = {
    snapshot_id: snapshotId,
    taken_at: now.toISOString(),
    db_path: "lab/memory/skills_lab_memory.sqlite",
    totals: {
      episodes: episodesTotal,
      decisions: decisionsTotal
    },
    episodes: {
      by_skill: episodesBySkill,
      by_envelope: episodesByEnvelope,
      latest: episodesLatest
    },
    decisions: {
      by_scope: decisionsByScope,
      latest: decisionsLatest
    }
  };

  const outName = `SQLITE_MEMORY_SNAPSHOT_${fmt(now)}.json`;
  const outPath = path.join(OUTPUT_DIR, outName);
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf8");

  console.log(`[memory:snapshot] SQLite memory snapshot written to lab/memory/${outName}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[memory:snapshot] Error:", err.message || err);
    process.exit(1);
  });
}
