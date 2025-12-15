export function normalizeMetricValue(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? Number(num.toFixed(6)) : null;
}

export function computeIC({ events = [] } = {}) {
  let lastCtx = null;
  let switches = 0;
  for (const event of events) {
    if (!event || typeof event !== "object") continue;
    const ctx = typeof event.ctx === "string" ? event.ctx.trim() : null;
    if (!ctx) continue;
    if (lastCtx && ctx && ctx !== lastCtx) switches += 1;
    lastCtx = ctx;
  }
  return {
    ic_value: switches,
    details: { switches, events_count: events.length }
  };
}

export function normalizePathForInputs({ repoRoot, inputPath }) {
  const cleanRepoRoot = repoRoot.replace(/\\/g, "/");
  const cleanPath = inputPath.replace(/\\/g, "/");
  if (!cleanPath.startsWith(cleanRepoRoot)) {
    return { path: cleanPath, relative: false };
  }
  return {
    path: cleanPath.slice(cleanRepoRoot.length + 1),
    relative: true
  };
}
