export const STATUS_LABEL = { draft: "Draft", live: "Live", paused: "Paused", ended: "Ended", published: "Published" };
export const SYNC_LABEL = { not_synced: "Not synced", simulated: "Simulated", synced: "Synced", error: "Error", syncing: "Syncing…" };

export function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function fmtTime(iso) {
  if (!iso) return "Never";
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " at " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

export function pill(status, label) {
  return `<span class="pill ${status}">${escapeHtml(label)}</span>`;
}

export function statusPill(status) {
  return pill(status, STATUS_LABEL[status] || status);
}

export function syncPill(status) {
  return pill(status, SYNC_LABEL[status] || status);
}

// Minimal JSON pretty-printer + syntax highlighter (keys, strings, numbers, booleans/null).
export function highlightJSON(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const padIn = "  ".repeat(indent + 1);

  if (value === null || value === undefined) return '<span class="jb">null</span>';
  if (typeof value === "number") return `<span class="jn">${value}</span>`;
  if (typeof value === "boolean") return `<span class="jb">${value}</span>`;
  if (typeof value === "string") return `<span class="js">"${escapeHtml(value)}"</span>`;

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => padIn + highlightJSON(v, indent + 1));
    return "[\n" + items.join(",\n") + "\n" + pad + "]";
  }

  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";
  const lines = keys.map((k) => `${padIn}<span class="jk">"${escapeHtml(k)}"</span>: ${highlightJSON(value[k], indent + 1)}`);
  return "{\n" + lines.join(",\n") + "\n" + pad + "}";
}

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function qs(root, sel) {
  return root.querySelector(sel);
}
export function qsa(root, sel) {
  return Array.from(root.querySelectorAll(sel));
}
