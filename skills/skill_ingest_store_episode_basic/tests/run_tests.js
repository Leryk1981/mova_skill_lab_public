const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { storeSkillIngestEpisodeBasic } = require("../impl/code/store_episode");

function testStoreEpisode() {
  const tempDir = path.join(__dirname, "tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const envelope = {
    envelope_type: "env.skill_ingest_run_store_episode_v1",
    envelope_id: "env-abc",
    mova_version: "4.0.0",
    episode: {
      mova_version: "4.0.0",
      episode_id: "ep-123",
      envelope_id: "env.skill_ingest_run_request_v1",
      run_result: { run_id: "run-1", status: "success", mova_version: "4.0.0" }
    }
  };

  const res = storeSkillIngestEpisodeBasic(envelope, {
    baseDir: tempDir,
    fileName: "ep-123.json"
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.episode_id, "ep-123");
  const outPath = path.join(tempDir, "ep-123.json");
  assert.strictEqual(res.path, outPath);
  assert.ok(fs.existsSync(outPath));
  const data = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.strictEqual(data.episode_id, "ep-123");
  assert.strictEqual(data.run_result.run_id, "run-1");
}

function main() {
  testStoreEpisode();
  console.log("skill_ingest_store_episode_basic tests passed.");
}

if (require.main === module) {
  main();
}
