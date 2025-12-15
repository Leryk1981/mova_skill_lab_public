const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  runSkillIngestWithSkillSeekerBasic,
  buildSkillSeekerArgs,
  writeTempConfig
} = require("../impl/code/run_ingest");

function testBuildArgs() {
  const runConfig = {
    mode: "scrape+enhance",
    run_id: "run-1",
    execution_flags: {
      async_enabled: true,
      workers: 4,
      skip_scrape: true,
      resume_checkpoint: true
    },
    enhancement: {
      enhance_local: true,
      enhance_via_api: true
    }
  };
  const args = buildSkillSeekerArgs("scrape+enhance", "/tmp/cfg.json", runConfig);
  assert.strictEqual(args[0], "unified");
  assert.ok(args.includes("--async"));
  assert.ok(args.includes("--workers"));
  assert.ok(args.includes("--skip-scrape"));
  assert.ok(args.includes("--resume-checkpoint"));
  assert.ok(args.includes("--enhance-local"));
  assert.ok(args.includes("--enhance"));
}

async function testRunWithStubExecutor() {
  const tempRoot = path.join(__dirname, "tmp");
  if (!fs.existsSync(tempRoot)) fs.mkdirSync(tempRoot, { recursive: true });

  const envelope = {
    envelope_type: "env.skill_ingest_run_request_v1",
    envelope_id: "env-1",
    mova_version: "4.0.0",
    skill_ingest_source_config: {
      mova_version: "4.0.0",
      config_id: "cfg-1",
      name: "react",
      sources: [{ kind: "docs", url: "https://react.dev" }]
    },
    skill_ingest_run_config: {
      mova_version: "4.0.0",
      run_id: "run-123",
      mode: "estimate",
      output_naming: {
        output_name: "react",
        output_dir: "output"
      }
    }
  };

  const calls = [];
  const stubExecutor = async (cmd, args) => {
    calls.push({ cmd, args });
    return {
      exitCode: 0,
      stdout: "ok",
      stderr: "",
      started_at: "2025-12-05T00:00:00Z",
      finished_at: "2025-12-05T00:00:01Z",
      duration_ms: 1000
    };
  };

  const result = await runSkillIngestWithSkillSeekerBasic(envelope, {
    executor: stubExecutor,
    tempDir: tempRoot
  });

  assert.strictEqual(result.run_id, "run-123");
  assert.strictEqual(result.status, "success");
  assert.deepStrictEqual(result.output_locations, {
    data_dir: path.join("output", "react_data"),
    skill_dir: path.join("output", "react"),
    zip_path: path.join("output", "react.zip")
  });
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].cmd, "skill-seekers");
  assert.strictEqual(calls[0].args[0], "estimate");

  const writtenConfig = path.join(tempRoot, "run-123.json");
  assert.ok(fs.existsSync(writtenConfig));
  const cfg = JSON.parse(fs.readFileSync(writtenConfig, "utf8"));
  assert.strictEqual(cfg.name, "react");
}

function testWriteTempConfig() {
  const tempRoot = path.join(__dirname, "tmp2");
  const p = writeTempConfig("abc", { name: "demo" }, tempRoot);
  assert.ok(fs.existsSync(p));
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  assert.strictEqual(data.name, "demo");
}

async function main() {
  await testRunWithStubExecutor();
  testBuildArgs();
  testWriteTempConfig();
  console.log("skill_ingest_run_with_skillseeker_basic tests passed.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
