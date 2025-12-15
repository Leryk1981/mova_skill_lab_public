#!/usr/bin/env node

/**
 * Import decisions into lab/memory/skills_lab_memory.sqlite.
 * Currently scans docs/PROJECT_MEMORY/decisions/*.json (glob) if present.
 * Designed to be a no-op when no decision sources exist.
 */

const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const ROOT = path.join(__dirname, "..", "..");
const DB_PATH = path.join(ROOT, "lab", "memory", "skills_lab_memory.sqlite");
const DECISIONS_DIR = path.join(ROOT, "docs", "PROJECT_MEMORY", "decisions");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function collectDecisionFiles() {
  if (!fs.existsSync(DECISIONS_DIR)) return [];
  return fs
    .readdirSync(DECISIONS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .map((f) => path.join(DECISIONS_DIR, f));
}

function toTags(tags) {
  if (Array.isArray(tags)) return tags.join(",");
  if (typeof tags === "string") return tags;
  return null;
}

async function main() {
  ensureDir(path.dirname(DB_PATH));
  const SQL = await initSqlJs();
  const db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();

  db.run(
    `CREATE TABLE IF NOT EXISTS decisions (
      id            TEXT PRIMARY KEY,
      context_scope TEXT,
      context_ref   TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT,
      title         TEXT NOT NULL,
      summary       TEXT,
      tags          TEXT,
      raw_json      TEXT NOT NULL
    )`
  );

  // If no sources, keep existing decisions and exit gracefully.
  const files = collectDecisionFiles();
  if (!files.length) {
    console.log("[memory:import:decisions] No decisions sources found; leaving table as is.");
    const exported = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(exported));
    return;
  }

  db.run("DELETE FROM decisions");
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO decisions (id, context_scope, context_ref, created_at, updated_at, title, summary, tags, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  let imported = 0;
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      const id = data.id || path.basename(file, ".json");
      if (!id) continue;
      stmt.run([
        id,
        data.context_scope || null,
        data.context_ref || null,
        data.created_at || new Date(fs.statSync(file).mtime).toISOString(),
        data.updated_at || null,
        data.title || id,
        data.summary || null,
        toTags(data.tags),
        raw
      ]);
      imported += 1;
    } catch (err) {
      console.error(`[memory:import:decisions] Failed on ${file}: ${err.message}`);
    }
  }

  stmt.free();
  const exported = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(exported));
  console.log(`[memory:import:decisions] Imported ${imported} decisions into ${DB_PATH}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[memory:import:decisions] Error:", err.message || err);
    process.exit(1);
  });
}
