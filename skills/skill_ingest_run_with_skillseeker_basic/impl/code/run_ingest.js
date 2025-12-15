#!/usr/bin/env node

/**
 * Skill Seeker ingest runner.
 * Вход: env.skill_ingest_run_request_v1
 * Выход: ds.skill_ingest_run_result_v1
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeTempConfig(runId, configObject, baseDir) {
  const rootDir = path.join(__dirname, "..", "..", "..", "..");
  const tempDir =
    baseDir ||
    path.join(rootDir, "lab", "tmp", "skill_seeker");
  ensureDir(tempDir);
  const filePath = path.join(tempDir, `${runId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(configObject, null, 2), "utf8");
  return filePath;
}

function buildSkillSeekerArgs(mode, configPath, runConfig) {
  const primary =
    mode === "estimate"
      ? "estimate"
      : mode === "scrape"
      ? "scrape"
      : "unified";

  const args = [primary, "--config", configPath];

  const execFlags = runConfig.execution_flags || {};
  if (execFlags.async_enabled) {
    args.push("--async");
    if (typeof execFlags.workers === "number") {
      args.push("--workers", String(execFlags.workers));
    }
  }
  if (execFlags.skip_scrape) {
    args.push("--skip-scrape");
  }
  if (execFlags.resume_checkpoint) {
    args.push("--resume-checkpoint");
  }

  const enhancement = runConfig.enhancement || {};
  if (enhancement.enhance_local) {
    args.push("--enhance-local");
  }
  if (enhancement.enhance_via_api) {
    args.push("--enhance");
  }

  return args;
}

function executeCommand(command, args, options = {}) {
  const cwd = options.cwd || path.join(__dirname, "..", "..", "..", "..");
  const startedAt = new Date();

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: process.platform === "win32"
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("close", (code) => {
      const finishedAt = new Date();
      resolve({
        exitCode: code,
        stdout,
        stderr,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime()
      });
    });
  });
}

function buildOutputLocations(sourceConfig, runConfig) {
  const outputDir =
    (runConfig.output_naming && runConfig.output_naming.output_dir) || "output";
  const baseName =
    (runConfig.output_naming && runConfig.output_naming.output_name) ||
    sourceConfig.name ||
    "skill";

  return {
    data_dir: path.join(outputDir, `${baseName}_data`),
    skill_dir: path.join(outputDir, baseName),
    zip_path: path.join(outputDir, `${baseName}.zip`)
  };
}

function mapSourceToSkillSeeker(source) {
  const kind = source.kind;
  if (kind === "docs" || kind === "unified") {
    return {
      type: "documentation",
      base_url: source.url,
      selectors: source.selectors,
      url_patterns: source.url_patterns,
      categories: source.categories,
      rate_limit: source.rate_limits,
      max_pages: source.max_pages,
      crawl_depth: source.crawl_depth
    };
  }
  if (kind === "github") {
    return {
      type: "github",
      repo: source.repo,
      include_code: source.include_code,
      include_issues: source.include_issues,
      include_releases: source.include_releases,
      include_changelog: source.include_changelog,
      code_analysis_depth: source.code_analysis_depth,
      file_patterns: source.file_patterns
    };
  }
  if (kind === "pdf") {
    return {
      type: "pdf",
      pdf_path: source.pdf_path,
      extract_tables: source.extract_tables,
      use_ocr: source.use_ocr,
      password: source.password
    };
  }
  // Fallback: pass-through
  return source;
}

async function runSkillIngestWithSkillSeekerBasic(envelope, opts = {}) {
  if (!envelope || envelope.envelope_type !== "env.skill_ingest_run_request_v1") {
    throw new Error("Invalid envelope_type, expected env.skill_ingest_run_request_v1");
  }

  const sourceConfig = envelope.skill_ingest_source_config;
  const runConfig = envelope.skill_ingest_run_config;

  if (!sourceConfig || !runConfig) {
    throw new Error("Missing skill_ingest_source_config or skill_ingest_run_config");
  }

  const mode = runConfig.mode;
  const runId = runConfig.run_id;
  if (!mode || !runId) {
    throw new Error("run_config.mode and run_config.run_id are required");
  }

  // Собираем временный конфиг Skill Seeker
  const tempConfigObj = {
    name: sourceConfig.name,
    description: sourceConfig.description,
    merge_mode:
      typeof sourceConfig.merge_strategy === "string"
        ? sourceConfig.merge_strategy
        : "rule-based",
    sources: Array.isArray(sourceConfig.sources)
      ? sourceConfig.sources.map(mapSourceToSkillSeeker)
      : [],
    categories: sourceConfig.categories,
    router_strategy: sourceConfig.router_strategy
  };

  const tempConfigPath = writeTempConfig(
    runId,
    tempConfigObj,
    opts.tempDir
  );

  const args = buildSkillSeekerArgs(mode, tempConfigPath, runConfig);
  const executor = opts.executor || executeCommand;

  const execResult = await executor("skill-seekers", args, {
    cwd: opts.cwd
  });

  const status = execResult.exitCode === 0 ? "success" : "failed";

  const output_locations = buildOutputLocations(sourceConfig, runConfig);

  const result = {
    mova_version: "4.0.0",
    run_id: runId,
    status,
    timing: {
      started_at: execResult.started_at,
      finished_at: execResult.finished_at,
      duration_ms: execResult.duration_ms
    },
    output_locations
  };

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  let envelopePath = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--envelope" || arg === "-e") {
      envelopePath = args[i + 1];
      i++;
    } else if (!envelopePath && !arg.startsWith("-")) {
      envelopePath = arg;
    }
  }

  if (!envelopePath) {
    console.error("Usage: node run_ingest.js --envelope <path/to/envelope.json>");
    process.exit(1);
  }

  const absolutePath = path.isAbsolute(envelopePath)
    ? envelopePath
    : path.join(process.cwd(), envelopePath);

  const envelope = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  try {
    const res = await runSkillIngestWithSkillSeekerBasic(envelope);
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
  runSkillIngestWithSkillSeekerBasic,
  buildSkillSeekerArgs,
  writeTempConfig,
  executeCommand,
  buildOutputLocations
};
