#!/usr/bin/env node

/**
 * File cleanup plan (no deletions).
 * Input: env.file_cleanup_plan_request_v1 (contains snapshot + preferences)
 * Output: ds.file_cleanup_plan_v1
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

function ageInDays(isoDate) {
  if (!isoDate) return null;
  const dt = new Date(isoDate).getTime();
  if (Number.isNaN(dt)) return null;
  const diffMs = Date.now() - dt;
  return diffMs / (1000 * 60 * 60 * 24);
}

function detectExtensionGroup(ext) {
  const e = (ext || "").toLowerCase();
  if (["exe", "msi", "dmg", "pkg", "deb", "appimage"].includes(e)) return "installer";
  if (["zip", "rar", "7z", "tar", "gz", "tgz"].includes(e)) return "archive";
  if (["pdf", "doc", "docx", "odt", "xls", "xlsx", "ppt", "pptx"].includes(e)) return "document";
  if (["mp4", "mkv", "mov", "avi"].includes(e)) return "media_video";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(e)) return "media_image";
  return "other";
}

function detectPathRole(p, target) {
  const lower = p.toLowerCase();
  if (lower.includes("\\downloads\\") || lower.includes("/downloads")) return "downloads";
  if (lower.includes("\\desktop\\") || lower.includes("/desktop")) return "desktop";
  if (lower.includes("\\documents\\") || lower.includes("/documents")) return "documents";
  if (lower.includes("/windows") || lower.includes("\\windows") || lower.includes("/usr") || lower.includes("/system32") || lower.includes("appdata")) return "systemish";
  if (target && target.root_path && p.startsWith(path.resolve(target.root_path))) return "project_or_other";
  return "unknown";
}

function sizeGroup(bytes) {
  const b = bytes || 0;
  if (b < 10 * 1024 * 1024) return "small";
  if (b < 100 * 1024 * 1024) return "medium";
  if (b < 1024 * 1024 * 1024) return "large";
  return "huge";
}

function decideAction(file, prefs, target) {
  const neverDeleteExtensions = prefs.neverDeleteExtensions;
  const maxAgeTempDays = prefs.maxAgeTempDays;
  const minSizeArchiveBytes = prefs.minSizeArchiveBytes;

  if (file.kind !== "file") {
    return { action: "keep", reason: "directory or non-file entry" };
  }
  const ext = file.extension || "";
  if (neverDeleteExtensions.has(ext)) {
    return { action: "keep", reason: "protected by preferences" };
  }

  const ageDays = ageInDays(file.last_modified);
  const extGroup = detectExtensionGroup(ext);
  const pathRole = detectPathRole(file.path, target);
  const sizeBytes = file.size_bytes || 0;

  if (pathRole === "systemish") {
    return { action: "keep", reason: "systemish path; never touch in basic plan" };
  }

  if (pathRole === "downloads" && extGroup === "installer") {
    if (ageDays !== null && ageDays >= maxAgeTempDays) {
      return { action: "delete", reason: "old installer in Downloads; safe to remove" };
    }
    return { action: "keep", reason: "recent installer; keep for now" };
  }

  if (pathRole === "downloads" && extGroup === "archive") {
    if (ageDays !== null && ageDays >= maxAgeTempDays) {
      return { action: "archive", reason: "old archive in Downloads; move to archive folder" };
    }
    return { action: "keep", reason: "recent archive; keep for now" };
  }

  if (pathRole === "desktop") {
    if (ageDays !== null && ageDays >= 30) {
      return { action: "archive", reason: "old Desktop item; move to Desktop_Archive" };
    }
    return { action: "keep", reason: "recent Desktop item" };
  }

  if (extGroup === "media_video" && sizeBytes >= minSizeArchiveBytes && ageDays !== null && ageDays >= maxAgeTempDays) {
    return { action: "archive", reason: "large old video; consider archiving" };
  }

  if ((pathRole === "documents" || pathRole === "project_or_other") && extGroup === "document") {
    return { action: "keep", reason: "document in user area; keep by default" };
  }

  return { action: "ask", reason: "unknown type or location; requires user decision" };
}

function buildPlan(envelope) {
  const snapshot = envelope.snapshot;
  if (!snapshot || !Array.isArray(snapshot.files)) throw new Error("Snapshot missing or invalid");
  const prefs = envelope.preferences || {};
  const maxAgeTempDays = prefs.max_age_days_for_temp ?? 90;
  const minSizeArchiveBytes = prefs.min_size_bytes_for_archive ?? 100 * 1024 * 1024;
  const aggressiveness = prefs.aggressiveness ?? "balanced";
  const neverDeleteExtensions = new Set(prefs.never_delete_extensions || []);

  const items = [];
  let filesToDelete = 0;
  let filesToArchive = 0;
  let filesToKeep = 0;
  let bytesFreed = 0;

  for (const f of snapshot.files) {
    const decision = decideAction(f, { maxAgeTempDays, minSizeArchiveBytes, neverDeleteExtensions }, snapshot.target);
    items.push({
      path: f.path,
      action: decision.action,
      reason: decision.reason
    });
    if (decision.action === "delete") {
      filesToDelete += 1;
      bytesFreed += f.size_bytes || 0;
    } else if (decision.action === "archive") {
      filesToArchive += 1;
      bytesFreed += f.size_bytes || 0;
    } else if (decision.action === "keep") {
      filesToKeep += 1;
    }
  }

  const planId = `file_cleanup_plan_${snapshot.snapshot_id}_${Date.now()}`;
  const strategy = "basic rules: installers/archives in Downloads, old Desktop items to archive, large old videos to archive, documents keep, unknown ask";

  return {
    mova_version: "4.0.0",
    plan_id: planId,
    snapshot_id: snapshot.snapshot_id,
    generated_at: new Date().toISOString(),
    strategy,
    items,
    summary: {
      files_to_delete: filesToDelete,
      files_to_archive: filesToArchive,
      files_to_keep: filesToKeep,
      estimated_bytes_freed: bytesFreed
    }
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.envelope) {
    console.error("Usage: node run_plan.js --envelope <path> [--output <path>]");
    process.exit(1);
  }
  const envPath = path.isAbsolute(args.envelope)
    ? args.envelope
    : path.join(process.cwd(), args.envelope);
  const envelope = loadJson(envPath);
  try {
    const plan = buildPlan(envelope);
    const outJson = JSON.stringify(plan, null, 2);
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
  buildPlan,
  ageInDays,
  detectExtensionGroup,
  detectPathRole,
  sizeGroup,
  decideAction
};
