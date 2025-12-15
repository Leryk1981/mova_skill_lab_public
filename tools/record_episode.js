#!/usr/bin/env node

// Simple episode recorder for MOVA Skills Lab.
// Takes a skill_id and a case file (with envelope + expected_output)
// and writes a ds.episode_v1 JSON into the skill's episodes/ directory.

const fs = require("fs");
const path = require("path");

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node tools/record_episode.js --skill-id <skill.id> --case-file <path/to/case.json>",
      "",
      "Example:",
      "  node tools/record_episode.js \\",
      "    --skill-id skill.context7_docs \\",
      "    --case-file skills/context7_docs/cases/context7_docs_ajv_draft2020_case_01.json"
    ].join("\n")
  );
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--skill-id") {
      args.skillId = argv[++i];
    } else if (arg === "--case-file") {
      args.caseFile = argv[++i];
    } else if (arg === "--status") {
      args.status = argv[++i];
    } else if (arg === "--actor-role") {
      args.actorRole = argv[++i];
    } else if (arg === "--actor-id") {
      args.actorId = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }
  return args;
}

function nowIso() {
  return new Date().toISOString();
}

function isoForFilename(iso) {
  // 2025-12-03T12:00:00.000Z -> 2025-12-03T12-00-00Z
  return iso.replace(/:/g, "-").replace(/\.\d+Z$/, "Z");
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!args.skillId || !args.caseFile) {
    console.error("[record_episode] Missing required arguments.");
    printUsage();
    process.exit(1);
  }

  const rootDir = path.join(__dirname, "..");

  const casePath = path.isAbsolute(args.caseFile)
    ? args.caseFile
    : path.join(rootDir, args.caseFile);

  if (!fs.existsSync(casePath)) {
    console.error(`[record_episode] Case file not found: ${casePath}`);
    process.exit(1);
  }

  const caseData = JSON.parse(fs.readFileSync(casePath, "utf8"));

  if (!caseData.envelope) {
    console.error("[record_episode] Case file must contain an 'envelope' field.");
    process.exit(1);
  }
  if (!caseData.expected_output) {
    console.error("[record_episode] Case file must contain an 'expected_output' field.");
    process.exit(1);
  }

  const envelope = caseData.envelope;
  const output = caseData.expected_output;

  const startedAt = nowIso();
  const finishedAt = nowIso(); // simple approximation for now

  const skillId = args.skillId;
  const skillName = skillId.replace(/^skill\./, "");
  const episodesDir = path.join(rootDir, "skills", skillName, "episodes");

  if (!fs.existsSync(episodesDir)) {
    fs.mkdirSync(episodesDir, { recursive: true });
  }

  const status = args.status || "succeeded";
  const actorRole = args.actorRole || "agent";
  const actorId = args.actorId || "manual-cli";

  const episodeIdBase = `${isoForFilename(startedAt)}_${skillName}`;
  const episodeId = `${episodeIdBase}_auto`;

  const episode = {
    episode_id: episodeId,
    envelope_id: envelope.envelope_id || `${skillId}.unknown_envelope`,
    skill_id: skillId,
    status,
    actor: {
      role: actorRole,
      id: actorId
    },
    started_at: startedAt,
    finished_at: finishedAt,
    input: envelope,
    output,
    error: null,
    meta: {
      case_id: caseData.case_id || null
    }
  };

  const fileName = `${episodeId}.json`;
  const outPath = path.join(episodesDir, fileName);

  fs.writeFileSync(outPath, JSON.stringify(episode, null, 2), "utf8");

  console.log("[record_episode] Episode written to:", path.relative(rootDir, outPath));
}

if (require.main === module) {
  main();
}

