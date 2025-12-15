const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const assert = require("assert");

function createTempDirWithFiles() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "file_cleanup_snapshot_"));
  const sub = path.join(base, "sub");
  fs.mkdirSync(sub);
  fs.writeFileSync(path.join(base, "a.txt"), "hello", "utf8");
  fs.writeFileSync(path.join(sub, "b.log"), "world", "utf8");
  return base;
}

function writeEnvelope(rootPath, filePath) {
  const env = {
    mova_version: "4.0.0",
    envelope_type: "env.file_cleanup_snapshot_request_v1",
    envelope_id: "test_snapshot",
    target: {
      mova_version: "4.0.0",
      target_id: "test_target",
      root_path: rootPath,
      os_family: "other"
    }
  };
  fs.writeFileSync(filePath, JSON.stringify(env, null, 2), "utf8");
}

function runSnapshot(envPath, outPath) {
  const script = path.join(
    "skills",
    "skill_file_cleanup_snapshot_node_basic",
    "impl",
    "code",
    "run_snapshot.js"
  );
  const res = spawnSync("node", [script, "--envelope", envPath, "--output", outPath], {
    encoding: "utf8"
  });
  return res;
}

function main() {
  const root = createTempDirWithFiles();
  const envPath = path.join(root, "env.json");
  const outPath = path.join(root, "snapshot.json");
  writeEnvelope(root, envPath);
  const res = runSnapshot(envPath, outPath);
  assert.strictEqual(res.status, 0, `Process failed: ${res.stderr}`);
  const snapshot = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.ok(Array.isArray(snapshot.files) && snapshot.files.length > 0, "No files captured");
  assert.ok(snapshot.stats.total_files > 0, "Stats missing files");
  console.log("skill_file_cleanup_snapshot_node_basic test passed.");
}

if (require.main === module) {
  main();
}
