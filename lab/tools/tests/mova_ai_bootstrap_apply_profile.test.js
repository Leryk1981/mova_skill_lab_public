const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

function runApply(packPath, outDir) {
  const script = path.join("lab", "tools", "mova_ai_bootstrap_apply_profile.js");
  const res = spawnSync("node", [script, "--pack", packPath, "--out-dir", outDir], {
    encoding: "utf8"
  });
  if (res.error) throw res.error;
  return res;
}

function main() {
  const packPath = path.join("lab", "examples", "mova_ai_bootstrap_pack.chatgpt_main.v1.json");
  if (!fs.existsSync(packPath)) {
    throw new Error(`Pack file missing for test: ${packPath}`);
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mova_bootstrap_apply_"));

  const res = runApply(packPath, tmpDir);
  assert.strictEqual(res.status, 0, `Process exited with ${res.status}: ${res.stderr}`);

  const targetId = "chatgpt_main";
  const systemPath = path.join(tmpDir, `${targetId}.system_prompt.txt`);
  const guidePath = path.join(tmpDir, `${targetId}.assistant_guide.md`);
  const checklistPath = path.join(tmpDir, `${targetId}.checklist.txt`);

  [systemPath, guidePath, checklistPath].forEach((p) => {
    assert.ok(fs.existsSync(p), `File not found: ${p}`);
  });

  const systemContent = fs.readFileSync(systemPath, "utf8");
  assert.ok(systemContent.includes("MOVA 4.0.0"), "System prompt missing MOVA 4.0.0");
  assert.ok(systemContent.toLowerCase().includes("chatgpt_main"), "System prompt missing target id");

  console.log("mova_ai_bootstrap_apply_profile test passed.");
}

if (require.main === module) {
  main();
}
