#!/usr/bin/env node

/**
 * Skill Seeker ingest episode storage.
 * Вход: env.skill_ingest_run_store_episode_v1
 * Выход: { ok, episode_id, path }
 */
const fs = require("fs");
const path = require("path");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function resolveBaseDir(customDir) {
  if (customDir) return customDir;
  const envDir = process.env.STORE_EPISODE_BASE_DIR;
  if (envDir) return envDir;
  return path.join(__dirname, "..", "..", "..", "..", "lab", "episodes", "skill_ingest");
}

function storeSkillIngestEpisodeBasic(envelope, options = {}) {
  if (!envelope || envelope.envelope_type !== "env.skill_ingest_run_store_episode_v1") {
    throw new Error("Invalid envelope_type, expected env.skill_ingest_run_store_episode_v1");
  }

  const episode = envelope.episode;
  if (!episode) {
    throw new Error("Missing episode payload");
  }
  if (episode.mova_version !== "4.0.0") {
    throw new Error("episode.mova_version must be 4.0.0");
  }
  if (!episode.episode_id || !episode.envelope_id) {
    throw new Error("episode_id and envelope_id are required");
  }

  const baseDir = resolveBaseDir(options.baseDir);
  ensureDir(baseDir);

  const filename = options.fileName
    ? options.fileName
    : `${episode.episode_id}__${episode.envelope_id}.json`;
  const outPath = path.join(baseDir, filename);

  fs.writeFileSync(outPath, JSON.stringify(episode, null, 2), "utf8");

  return {
    ok: true,
    episode_id: episode.episode_id,
    path: outPath
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node store_episode.js <path/to/envelope.json>");
    process.exit(1);
  }
  const absolutePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath);

  const envelope = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  try {
    const res = storeSkillIngestEpisodeBasic(envelope);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  storeSkillIngestEpisodeBasic,
  resolveBaseDir
};
