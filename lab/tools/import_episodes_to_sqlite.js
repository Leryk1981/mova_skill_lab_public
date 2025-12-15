#!/usr/bin/env node

/**
 * Import all skill episodes (skills/<skill>/episodes/*.json glob) into lab/memory/skills_lab_memory.sqlite.
 * Uses sql.js (pure JS) so it works without native sqlite3 bindings.
 */

const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const ROOT = path.join(__dirname, "..", "..");
const DB_PATH = path.join(ROOT, "lab", "memory", "skills_lab_memory.sqlite");
const SKILLS_DIR = path.join(ROOT, "skills");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function collectEpisodeFiles() {
  const result = [];
  if (!fs.existsSync(SKILLS_DIR)) return result;

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json") && full.includes(`${path.sep}episodes${path.sep}`)) {
        result.push(full);
      }
    }
  };

  walk(SKILLS_DIR);
  return result;
}

function toTags(meta, rawTags) {
  if (Array.isArray(meta?.labels)) return meta.labels.join(",");
  if (typeof rawTags === "string") return rawTags;
  return null;
}

function pickCreatedAt(data, filePath) {
  return (
    data.started_at ||
    data.created_at ||
    data.finished_at ||
    new Date(fs.statSync(filePath).mtime).toISOString()
  );
}

async function main() {
  ensureDir(path.dirname(DB_PATH));
  const SQL = await initSqlJs();
  const db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();

  db.run(
    `CREATE TABLE IF NOT EXISTS episodes (
      id           TEXT PRIMARY KEY,
      envelope_id  TEXT NOT NULL,
      skill_id     TEXT,
      scenario_id  TEXT,
      created_at   TEXT NOT NULL,
      actor_role   TEXT,
      summary      TEXT,
      tags         TEXT,
      raw_json     TEXT NOT NULL
    )`
  );

  // Clear existing rows to avoid drift with deleted files.
  db.run("DELETE FROM episodes");

  const files = collectEpisodeFiles();
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO episodes (id, envelope_id, skill_id, scenario_id, created_at, actor_role, summary, tags, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  let imported = 0;
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      const id = data.episode_id || data.id || path.basename(file, ".json");
      if (!id) continue;

      stmt.run([
        id,
        data.envelope_id || null,
        data.skill_id || null,
        data.scenario_id || null,
        pickCreatedAt(data, file),
        data.actor?.role || null,
        data.summary || data.meta?.note || null,
        toTags(data.meta, data.tags),
        raw
      ]);
      imported += 1;
    } catch (err) {
      console.error(`[memory:import:episodes] Failed on ${file}: ${err.message}`);
    }
  }

  stmt.free();

  const exported = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(exported));

  console.log(`[memory:import:episodes] Imported ${imported} episode files into ${DB_PATH}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[memory:import:episodes] Error:", err.message || err);
    process.exit(1);
  });
}
