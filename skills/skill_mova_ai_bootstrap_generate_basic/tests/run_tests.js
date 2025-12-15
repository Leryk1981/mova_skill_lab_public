const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { spawnSync } = require("child_process");

function writeTempEnvelope(dir) {
  const env = {
    mova_version: "4.0.0",
    envelope_type: "env.mova_ai_bootstrap_generate_v1",
    envelope_id: "env-bootstrap-test-001",
    target: {
      mova_version: "4.0.0",
      target_id: "test_target",
      model_family: "openai:gpt-4.1",
      channel: "chat"
    }
  };
  const p = path.join(dir, "env.json");
  fs.writeFileSync(p, JSON.stringify(env, null, 2), "utf8");
  return p;
}

function runScript(envelopePath, outputPath) {
  const script = path.join(
    __dirname,
    "..",
    "impl",
    "code",
    "generate_bootstrap.js"
  );
  const res = spawnSync("node", [script, "--envelope", envelopePath, "--output", outputPath], {
    encoding: "utf8"
  });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(`Script exited with code ${res.status}: ${res.stderr}`);
  }
}

function testGenerateBootstrap() {
  const tempDir = path.join(__dirname, "tmp");
  fs.mkdirSync(tempDir, { recursive: true });
  const envPath = writeTempEnvelope(tempDir);
  const outPath = path.join(tempDir, "pack.json");

  runScript(envPath, outPath);

  const pack = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.strictEqual(pack.mova_version, "4.0.0");
  assert.ok(typeof pack.pack_id === "string" && pack.pack_id.length > 0);
  assert.strictEqual(pack.target.target_id, "test_target");
  assert.ok(pack.instructions && typeof pack.instructions.summary === "string");
}

function main() {
  testGenerateBootstrap();
  console.log("skill_mova_ai_bootstrap_generate_basic tests passed.");
}

if (require.main === module) {
  main();
}
