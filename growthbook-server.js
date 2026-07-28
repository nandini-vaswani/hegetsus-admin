// Server-side only. Never imported by browser code in src/ — the API key must
// never reach the client. Loaded and used exclusively by server.js.
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(dir) {
  const envPath = path.join(dir, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function initEnv(dir) {
  loadEnvFile(dir);
}

export function isConnected() {
  return Boolean(process.env.GROWTHBOOK_API_KEY);
}

const GROWTHBOOK_API_BASE = "https://api.growthbook.io/api/v2";

// Shape verified directly against GrowthBook's live OpenAPI spec
// (https://api.growthbook.io/api/v1/openapi.yaml) and against real 400s from
// a live account. v2 create/update do NOT use a nested `environments` map --
// a feature's live/off state is just its top-level `defaultValue`, and
// per-audience targeting is a top-level `rules` array (each rule scoped by
// `allEnvironments` / `environments`). Creating via a plain API key (not a
// PAT) also requires an explicit `owner` email -- discovered from a real
// 400 ("Must specify an owner...") the first time this was tested live.
//
//   POST /v2/features        create  -- body includes `id` + `valueType`
//   POST /v2/features/:id    update  -- partial/patch; no `id`/`valueType` in body
//
// Shared by both the Experiments sync (boolean on/off, no rules) and the
// Personalization sync (string-valued feature whose value is decided by
// force rules keyed on visitor attributes -- see syncPersonalizationToGrowthBook).
async function createOrUpdateFeature({ key, valueType, defaultValue, description, tags, rules }) {
  const apiKey = process.env.GROWTHBOOK_API_KEY;

  if (!apiKey) {
    return { ok: true, simulated: true, growthbookKey: key, message: "Demo mode: no GrowthBook API key configured on the server, so this was simulated, not sent." };
  }

  const owner = process.env.GROWTHBOOK_OWNER_EMAIL;
  if (!owner) {
    return {
      ok: false,
      simulated: false,
      growthbookKey: key,
      message:
        "GrowthBook requires an `owner` (email) on features created via an API key. Set GROWTHBOOK_OWNER_EMAIL in .env to the email of the GrowthBook account/member that should own synced features, then restart the server.",
    };
  }

  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  const createBody = { id: key, valueType, defaultValue, description: description || "", tags: tags || [], owner };
  if (rules) createBody.rules = rules;
  if (process.env.GROWTHBOOK_PROJECT_ID) createBody.project = process.env.GROWTHBOOK_PROJECT_ID;

  try {
    let res = await fetch(`${GROWTHBOOK_API_BASE}/features`, { method: "POST", headers, body: JSON.stringify(createBody) });

    if (!res.ok) {
      const createErrText = await res.text();
      console.log(`[growthbook] create failed (${res.status}): ${createErrText}`);

      // Only treat this as "already exists" and fall back to update if the
      // error actually says so -- otherwise surface the real create error.
      if (/already exists|duplicate/i.test(createErrText)) {
        const updateBody = { description: description || "", defaultValue, owner };
        if (rules) updateBody.rules = rules;
        res = await fetch(`${GROWTHBOOK_API_BASE}/features/${encodeURIComponent(key)}`, { method: "POST", headers, body: JSON.stringify(updateBody) });
      } else {
        return { ok: false, simulated: false, growthbookKey: key, message: `GrowthBook API error (${res.status}): ${createErrText.slice(0, 300)}` };
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, simulated: false, growthbookKey: key, message: `GrowthBook API error (${res.status}): ${errText.slice(0, 300)}` };
    }

    return { ok: true, simulated: false, growthbookKey: key, message: "Synced to GrowthBook." };
  } catch (err) {
    return { ok: false, simulated: false, growthbookKey: key, message: `Could not reach GrowthBook: ${err.message}` };
  }
}

export async function syncExperimentToGrowthBook({ key, name, hypothesis, status }) {
  if (!process.env.GROWTHBOOK_API_KEY) {
    console.log(`[growthbook] SIMULATED sync for "${name}" -> key "${key}" (no GROWTHBOOK_API_KEY set)`);
  }
  return createOrUpdateFeature({
    key,
    valueType: "boolean",
    defaultValue: status === "live" ? "true" : "false",
    description: hypothesis,
    tags: ["content-admin"],
  });
}

// A personalization policy is a distinct GrowthBook mechanism from an
// A/B experiment: it's a *string*-valued feature whose defaultValue is the
// fallback/default variant, and whose `rules` are ordered `force` rules --
// each one a deterministic "if this segment's condition matches, force this
// variant" -- not a random percentage split. This is the same distinction
// the Architecture Brief draws in scenario 3.5 ("Personalization by
// signal"): deliberate, rules-based content matching that can share the
// same delivery mechanism (a GrowthBook feature) as testing, without being
// a test itself.
//
// `rules` here is an array of { value, condition, description } built by
// src/lib/store.js from Segments + their attribute rules; this function
// just adds the `type: "force"` / `allEnvironments` envelope GrowthBook's
// v2 API expects per-rule.
export async function syncPersonalizationToGrowthBook({ key, description, defaultValue, rules }) {
  if (!process.env.GROWTHBOOK_API_KEY) {
    console.log(`[growthbook] SIMULATED personalization sync -> key "${key}" (no GROWTHBOOK_API_KEY set)`);
  }
  const gbRules = (rules || []).map((r) => ({
    type: "force",
    value: r.value,
    condition: r.condition,
    description: r.description || "",
    allEnvironments: true,
  }));
  return createOrUpdateFeature({
    key,
    valueType: "string",
    defaultValue,
    description,
    tags: ["personalization"],
    rules: gbRules,
  });
}
