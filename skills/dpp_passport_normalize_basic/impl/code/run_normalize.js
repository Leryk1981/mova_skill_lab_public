#!/usr/bin/env node

/**
 * Normalize a single DPP passport input into ds.lab_battery_passport_extended_v1.
 * Input envelope: env.dpp_passport_normalize_run_v1 (via --envelope or stdin).
 * Output: JSON with { normalized_passport } printed to stdout or written via --output.
 */

const fs = require("fs");
const path = require("path");

const EXPECTED_ENVELOPE_TYPE = "env.dpp_passport_normalize_run_v1";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--envelope" || arg === "-e") {
      args.envelope = argv[++i];
    } else if (arg === "--output" || arg === "-o") {
      args.output = argv[++i];
    }
  }
  return args;
}

function loadEnvelope(args) {
  if (args.envelope) {
    return JSON.parse(fs.readFileSync(args.envelope, "utf8"));
  }
  const stdin = fs.readFileSync(0, "utf8");
  if (!stdin.trim()) {
    throw new Error("No envelope provided via --envelope or stdin");
  }
  return JSON.parse(stdin);
}

function normalizePassport(input) {
  return {
    battery_id: input.passport_id,
    manufacturer_name: input.manufacturer_name,
    manufacturing_date: input.manufacturing_date,
    manufacturing_location: input.manufacturing_location,
    carbon_footprint: input.carbon_footprint,
    materials: input.materials,
    external_sources: input.external_sources || [],
    regulation_tags: input.regulation_tags || []
  };
}

function main() {
  const args = parseArgs(process.argv);
  const envelope = loadEnvelope(args);

  if (envelope.envelope_type !== EXPECTED_ENVELOPE_TYPE) {
    throw new Error(
      `Invalid envelope_type. Expected ${EXPECTED_ENVELOPE_TYPE}, got ${envelope.envelope_type}`
    );
  }

  const data = envelope.data || {};
  const input = data.input;
  if (!input) {
    throw new Error("Envelope data.input is missing");
  }

  const normalized = normalizePassport(input);
  const result = {
    normalized_passport: normalized
  };

  const serialized = JSON.stringify(result, null, 2);
  if (args.output) {
    const outPath = path.resolve(args.output);
    fs.writeFileSync(outPath, serialized, "utf8");
  } else {
    console.log(serialized);
  }
}

if (require.main === module) {
  main();
}
