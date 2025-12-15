const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { spawnSync } = require("child_process");

function makeSnapshotFile() {
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

  const snapshot = {
    mova_version: "4.0.0",
    snapshot_id: "snapshot_test_001",
    target: {
      mova_version: "4.0.0",
      target_id: "test_target",
      root_path: "C:/Downloads",
      os_family: "windows"
    },
    taken_at: now.toISOString(),
    files: [
      {
        path: "C:/Downloads/installer_old.exe",
        size_bytes: 50 * 1024 * 1024,
        last_modified: daysAgo(200),
        kind: "file",
        extension: "exe"
      },
      {
        path: "C:/Downloads/archive_old.zip",
        size_bytes: 10 * 1024 * 1024,
        last_modified: daysAgo(120),
        kind: "file",
        extension: "zip"
      },
      {
        path: "C:/Desktop/old_note.txt",
        size_bytes: 1024,
        last_modified: daysAgo(60),
        kind: "file",
        extension: "txt"
      },
      {
        path: "C:/Documents/report.docx",
        size_bytes: 2048,
        last_modified: daysAgo(5),
        kind: "file",
        extension: "docx"
      },
      {
        path: "C:/Unknown/weird.bin",
        size_bytes: 4096,
        last_modified: daysAgo(10),
        kind: "file",
        extension: "bin"
      }
    ],
    stats: {
      total_files: 5,
      total_dirs: 0,
      total_size_bytes: 60 * 1024 * 1024
    }
  };

  const env = {
    mova_version: "4.0.0",
    envelope_type: "env.file_cleanup_plan_request_v1",
    envelope_id: "test_plan_env",
    snapshot,
    preferences: {
      max_age_days_for_temp: 90,
      min_size_bytes_for_archive: 100 * 1024 * 1024,
      aggressiveness: "balanced",
      never_delete_extensions: ["key"]
    }
  };

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "file_cleanup_plan_"));
  const envPath = path.join(dir, "env.json");
  const outPath = path.join(dir, "plan.json");
  fs.writeFileSync(envPath, JSON.stringify(env, null, 2), "utf8");
  return { envPath, outPath };
}

function runPlan(envPath, outPath) {
  const script = path.join(
    "skills",
    "skill_file_cleanup_plan_node_basic",
    "impl",
    "code",
    "run_plan.js"
  );
  const res = spawnSync("node", [script, "--envelope", envPath, "--output", outPath], {
    encoding: "utf8"
  });
  return res;
}

function main() {
  const { envPath, outPath } = makeSnapshotFile();
  const res = runPlan(envPath, outPath);
  assert.strictEqual(res.status, 0, `Process failed: ${res.stderr}`);
  const plan = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.ok(plan.summary.files_to_delete >= 1, "Expected at least one delete");
  assert.ok(plan.summary.files_to_archive >= 1, "Expected at least one archive");
  const hasAsk = plan.items.some((i) => i.action === "ask");
  assert.ok(hasAsk, "Expected at least one ask item");
  console.log("skill_file_cleanup_plan_node_basic test passed.");
}

if (require.main === module) {
  main();
}
