#!/usr/bin/env node

/**
 * File cleanup snapshot (no deletions).
 * Input: env.file_cleanup_snapshot_request_v1
 * Output: ds.file_cleanup_snapshot_v1
 */

const fs = require("fs");
const path = require("path");

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

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function shouldExclude(p, patterns) {
  if (!patterns || !patterns.length) return false;
  return patterns.some((pat) => p.includes(pat));
}

function collectEntries(rootPath, excludePatterns, entries = []) {
  const dirents = fs.readdirSync(rootPath, { withFileTypes: true });
  for (const d of dirents) {
    const fullPath = path.join(rootPath, d.name);
    if (shouldExclude(fullPath, excludePatterns)) continue;
    const st = fs.lstatSync(fullPath);
    const common = {
      path: fullPath,
      last_modified: st.mtime.toISOString(),
      last_accessed: st.atime ? st.atime.toISOString() : undefined
    };
    if (st.isDirectory()) {
      entries.push({
        ...common,
        size_bytes: 0,
        kind: "dir"
      });
      collectEntries(fullPath, excludePatterns, entries);
    } else if (st.isFile()) {
      const ext = path.extname(d.name).replace(/^\./, "");
      entries.push({
        ...common,
        size_bytes: st.size,
        kind: "file",
        extension: ext || undefined
      });
    } else if (st.isSymbolicLink()) {
      entries.push({
        ...common,
        size_bytes: 0,
        kind: "symlink"
      });
    } else {
      entries.push({
        ...common,
        size_bytes: 0,
        kind: "other"
      });
    }
  }
  return entries;
}

function computeStats(entries) {
  let totalFiles = 0;
  let totalDirs = 0;
  let totalSize = 0;
  for (const e of entries) {
    if (e.kind === "file") {
      totalFiles += 1;
      totalSize += e.size_bytes || 0;
    } else if (e.kind === "dir") {
      totalDirs += 1;
    }
  }
  return {
    total_files: totalFiles,
    total_dirs: totalDirs,
    total_size_bytes: totalSize
  };
}

function buildSnapshot(envelope) {
  const target = envelope.target;
  const rootPath = path.resolve(target.root_path);
  if (!fs.existsSync(rootPath)) {
    throw new Error(`Root path does not exist: ${rootPath}`);
  }
  const excludePatterns = target.exclude_patterns || [];
  const files = collectEntries(rootPath, excludePatterns, []);
  const stats = computeStats(files);
  const snapshotId = `snapshot_${target.target_id}_${Date.now()}`;
  return {
    mova_version: "4.0.0",
    snapshot_id: snapshotId,
    target,
    taken_at: new Date().toISOString(),
    files,
    stats
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.envelope) {
    console.error("Usage: node run_snapshot.js --envelope <path> [--output <path>]");
    process.exit(1);
  }
  const envPath = path.isAbsolute(args.envelope)
    ? args.envelope
    : path.join(process.cwd(), args.envelope);
  const envelope = loadJson(envPath);
  try {
    const snapshot = buildSnapshot(envelope);
    const outJson = JSON.stringify(snapshot, null, 2);
    if (args.output) {
      const outPath = path.isAbsolute(args.output)
        ? args.output
        : path.join(process.cwd(), args.output);
      fs.writeFileSync(outPath, outJson, "utf8");
    } else {
      process.stdout.write(outJson + "\n");
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSnapshot,
  collectEntries,
  computeStats
};
