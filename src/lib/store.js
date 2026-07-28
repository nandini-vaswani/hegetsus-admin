// Tiny client-side data layer: seed data + localStorage persistence + CRUD.
// No backend, no framework — this is the "database" for the prototype.
import { slugify } from "./ui.js";

// Bump this whenever the seed/journey/block shape changes. A stale blob
// under an old key is simply ignored (the lookup misses) and the app
// reseeds automatically -- no crash, no manual reset needed.
//   v1 -> v2: added Segments + journey content blocks
//   v2 -> v3: added Topics + journey.topics
const STORAGE_KEY = "content-admin-experiments-v3";

const SEED = {
  experiments: [
    {
      id: "exp1",
      name: "Homepage CTA — anxiety vs. belonging messaging",
      status: "live",
      hypothesis:
        "Visitors who arrive from an anxiety-themed ad convert better on a starting journey framed around calm and stillness, rather than the default belonging-framed journey everyone else sees.",
      linkedFeature: "ff-homepage-cta-messaging",
      variants: [
        { name: "Control — default belonging framing", isControl: true, weight: 50, description: "Current homepage, shown to all traffic today." },
        { name: "Anxiety-ad variant", isControl: false, weight: 50, description: "Shown only to visitors whose entry campaign parameter matches an anxiety-themed ad." },
      ],
      metrics: { primary: "Journey Start Rate", secondary: ["Journey Completion Rate", "Time on Homepage"] },
      analysis: { differenceType: "Relative", dimension: "None" },
      appliesTo: [
        { kind: "journey", id: "j1", name: "The Path of Stillness" },
        { kind: "journey", id: "j2", name: "The Path of Presence" },
      ],
      sync: { status: "synced", key: "homepage-cta-anxiety-vs-belonging", lastSyncedAt: "2026-07-28T09:14:00Z", message: "Synced to GrowthBook." },
      results: {
        available: true,
        visitors: 8420,
        confidence: "97% chance to beat control",
        rows: [
          { name: "Control — default belonging framing", isControl: true, visitors: 4230, rateNum: 18.2, lift: "—" },
          { name: "Anxiety-ad variant", isControl: false, visitors: 4190, rateNum: 23.6, lift: "+29.7%", winner: true },
        ],
      },
      versions: [
        { date: "28 Jul 2026, 2:44 PM", by: "Nandini", status: "live", current: true },
        { date: "24 Jul 2026, 10:05 AM", by: "Nandini", status: "draft" },
        { date: "18 Jul 2026, 4:30 PM", by: "Marcus", status: "draft" },
      ],
      createdAt: "2026-06-02T10:00:00Z",
    },
    {
      id: "exp2",
      name: "World Cup geofenced homepage test",
      status: "draft",
      hypothesis:
        "Soccer-heavy markets shown World Cup-specific framing on the homepage will engage more than the standard homepage, when combined with a mobile vs. desktop layout split.",
      linkedFeature: "ff-worldcup-homepage",
      variants: [
        { name: "Control — standard homepage", isControl: true, weight: 34, description: "" },
        { name: "World Cup framing — mobile", isControl: false, weight: 33, description: "" },
        { name: "World Cup framing — desktop", isControl: false, weight: 33, description: "" },
      ],
      metrics: { primary: "Homepage-to-Journey Click-Through Rate", secondary: ["Bounce Rate"] },
      analysis: { differenceType: "Relative", dimension: "Device Type" },
      appliesTo: [{ kind: "page", id: "p1", name: "Home" }],
      sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." },
      results: { available: false, reason: "Not live yet — results appear once this experiment is running." },
      versions: [{ date: "28 Jul 2026, 2:44 PM", by: "Nandini", status: "draft", current: true }],
      createdAt: "2026-07-28T14:44:00Z",
    },
    {
      id: "exp3",
      name: "Pause Experience — timer length",
      status: "paused",
      hypothesis:
        "A shorter 30-second pause (vs. the current 60-second default) keeps more visitors from dropping off mid-journey without weakening the meditative effect.",
      linkedFeature: "ff-pause-timer-length",
      variants: [
        { name: "Control — 60 seconds", isControl: true, weight: 50, description: "" },
        { name: "Shortened — 30 seconds", isControl: false, weight: 50, description: "" },
      ],
      metrics: { primary: "Journey Completion Rate", secondary: ["Average Session Duration"] },
      analysis: { differenceType: "Relative", dimension: "None" },
      appliesTo: [
        { kind: "journey", id: "j1", name: "The Path of Stillness" },
        { kind: "journey", id: "j3", name: "The Path of Compassion" },
      ],
      sync: { status: "error", key: "pause-experience-timer-length", lastSyncedAt: "2026-07-27T16:40:00Z", message: "GrowthBook API error (401): invalid or expired API key." },
      results: {
        available: true,
        visitors: 2150,
        confidence: "62% chance to beat control — not yet significant",
        rows: [
          { name: "Control — 60 seconds", isControl: true, visitors: 1080, rateNum: 71.4, lift: "—" },
          { name: "Shortened — 30 seconds", isControl: false, visitors: 1070, rateNum: 73.9, lift: "+3.5%", winner: false },
        ],
      },
      versions: [
        { date: "27 Jul 2026, 10:10 PM", by: "Nandini", status: "paused", current: true },
        { date: "20 Jul 2026, 9:00 AM", by: "Nandini", status: "live" },
        { date: "12 Jul 2026, 1:15 PM", by: "Nandini", status: "draft" },
      ],
      createdAt: "2026-06-20T09:00:00Z",
    },
  ],

  flags: [
    {
      key: "ff-homepage-cta-messaging",
      type: "Boolean",
      description: "Controls whether the anxiety-ad homepage variant renders instead of the default belonging framing.",
      defaultValue: "false",
      environments: { Development: true, Staging: true, Production: true },
      linkedExperimentId: "exp1",
      syncStatus: "synced",
      updatedAt: "2026-07-28T14:44:00Z",
    },
    {
      key: "ff-worldcup-homepage",
      type: "Boolean",
      description: "Toggles the World Cup geofenced homepage variant, split by device.",
      defaultValue: "false",
      environments: { Development: true, Staging: true, Production: false },
      linkedExperimentId: "exp2",
      syncStatus: "not_synced",
      updatedAt: "2026-07-28T14:44:00Z",
    },
    {
      key: "ff-pause-timer-length",
      type: "String",
      description: 'Which pause-timer duration variant a visitor sees — "60s" or "30s".',
      defaultValue: "60s",
      environments: { Development: true, Staging: true, Production: true },
      linkedExperimentId: "exp3",
      syncStatus: "error",
      updatedAt: "2026-07-27T22:10:00Z",
    },
    {
      key: "ff-stories-module-enabled",
      type: "Boolean",
      description: "Master toggle for the Stories content pillar across the site.",
      defaultValue: "true",
      environments: { Development: true, Staging: true, Production: true },
      linkedExperimentId: null,
      syncStatus: "synced",
      updatedAt: "2026-07-21T09:02:00Z",
    },
  ],

  // Segments — reusable population definitions (geo, device, network,
  // referral/campaign, day/time). A segment is *who*; it says nothing about
  // what they see. See scenarios 3.5/3.6 in the Architecture Brief.
  segments: [
    {
      id: "seg-geo-india", name: "India (Geo)", category: "geo",
      description: "Visitors located in India.",
      rules: [{ attribute: "country", operator: "equals", value: "IN" }],
    },
    {
      id: "seg-geo-soccer", name: "Soccer-heavy markets", category: "geo",
      description: "Geofenced World Cup markets — Brazil, Argentina, Mexico, Spain, Italy.",
      rules: [{ attribute: "country", operator: "in", value: "BR, AR, MX, ES, IT" }],
    },
    {
      id: "seg-device-mobile", name: "Mobile devices", category: "device",
      description: "Visitors on a phone or small touch device.",
      rules: [{ attribute: "deviceType", operator: "equals", value: "mobile" }],
    },
    {
      id: "seg-ref-anxiety-ad", name: "Entered via Anxiety ad", category: "referral",
      description: "Arrived from a campaign whose theme is anxiety.",
      rules: [{ attribute: "utm_campaign", operator: "equals", value: "anxiety" }],
    },
    {
      id: "seg-ref-belonging-ad", name: "Entered via Belonging ad", category: "referral",
      description: "Arrived from a campaign whose theme is belonging.",
      rules: [{ attribute: "utm_campaign", operator: "equals", value: "belonging" }],
    },
    {
      id: "seg-network-corporate", name: "Corporate / institutional network", category: "network",
      description: "Traffic from a recognized corporate or institutional IP range, rather than general consumer traffic.",
      rules: [{ attribute: "ipType", operator: "equals", value: "corporate" }],
    },
  ],

  // Topics — a shared content taxonomy across pillars (Journeys today;
  // Stories and Connect once those pillars exist). Independent of Segments:
  // a topic classifies *content* ("this journey is about grief"), a segment
  // classifies a *visitor* ("this visitor is on mobile in India"). Used to
  // surface related content across pillars — see Architecture Brief 3.1's
  // grief-journey -> testimonial-story -> connect-recommendation example.
  topics: [
    { id: "top-stillness", name: "Stillness", slug: "stillness", description: "Meditation, breath, quieting the mind." },
    { id: "top-anxiety", name: "Anxiety", slug: "anxiety", description: "Content addressing worry, overwhelm, and unease." },
    { id: "top-presence", name: "Presence", slug: "presence", description: "Mindful awareness of the current moment." },
    { id: "top-compassion", name: "Compassion", slug: "compassion", description: "Loving-kindness and self-compassion practices." },
    { id: "top-belonging", name: "Belonging", slug: "belonging", description: "Connection, community, and being known." },
    { id: "top-grief", name: "Grief", slug: "grief", description: "Loss and the process of grieving." },
  ],

  // Journeys — now with real content blocks ("ingredients"), some of which
  // can be personalized: a block-level assignment policy maps Segments to
  // Variants, with a default/fallback shown to everyone who matches no rule.
  // This is a distinct mechanism from Experiments (random split) — see the
  // note in views/journeys.js.
  journeys: [
    {
      id: "j1", title: "The Path of Stillness", slug: "stillness",
      intro: "Discover inner peace through the ancient practice of meditation and mindful breathing.",
      status: "published", updatedAt: "2026-06-10T18:59:00Z", createdAt: "2026-05-02T11:20:00Z",
      topics: ["top-stillness", "top-anxiety"],
      blocks: [
        {
          id: "blk-j1-hero", type: "hero", label: "Opening hero",
          content: { headline: "A space to be still", subhead: "What does your world look like right now?", media: "Ocean horizon, slow motion" },
          personalization: {
            enabled: true,
            rules: [
              { id: "pr-j1h-1", segmentId: "seg-ref-anxiety-ad", value: "anxiety-arm", content: { headline: "A space to breathe", subhead: "When anxiety crowds in, is there room to exhale?", media: "Close-up: a hand steadying on a railing" } },
              { id: "pr-j1h-2", segmentId: "seg-geo-india", value: "india-arm", content: { headline: "A space to belong", subhead: "What does home feel like, wherever you are?", media: "Warm interior light, family silhouette" } },
              { id: "pr-j1h-3", segmentId: "seg-device-mobile", value: "mobile-arm", content: { headline: "A space to be still", subhead: "Take a breath. Just for a moment.", media: "Vertical crop, ocean horizon" } },
            ],
            defaultValue: "default-arm",
            sync: { status: "synced", key: "journey-stillness-hero", lastSyncedAt: "2026-07-28T15:20:00Z", message: "Synced to GrowthBook." },
          },
        },
        {
          id: "blk-j1-text", type: "text", label: "Introduction",
          content: { body: "Discover inner peace through the ancient practice of meditation and mindful breathing." },
          personalization: { enabled: false, rules: [], defaultValue: "default-arm", sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." } },
        },
        {
          id: "blk-j1-prayer", type: "prayer_rotator", label: "Rotating prayer",
          content: { note: "Pulls a random prayer submitted by another visitor on every page load. This is resolved dynamically at request time — a different mechanism from segment-based personalization, so it isn't personalizable here." },
          personalization: null,
        },
        {
          id: "blk-j1-next", type: "next_step", label: "Where to next",
          content: { options: [{ label: "Continue to The Path of Presence", targetJourneyId: "j2" }, { label: "Continue to The Path of Compassion", targetJourneyId: "j3" }] },
          personalization: { enabled: false, rules: [], defaultValue: "default-arm", sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." } },
        },
      ],
    },
    {
      id: "j2", title: "The Path of Presence", slug: "presence",
      intro: "Awaken to the richness of each moment through mindful awareness practices.",
      status: "published", updatedAt: "2026-06-09T12:00:00Z", createdAt: "2026-05-02T11:25:00Z",
      topics: ["top-presence"],
      blocks: [
        {
          id: "blk-j2-hero", type: "hero", label: "Opening hero",
          content: { headline: "A space to be present", subhead: "Awaken to the richness of each moment.", media: "Slow pan, morning light through trees" },
          personalization: { enabled: false, rules: [], defaultValue: "default-arm", sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." } },
        },
        {
          id: "blk-j2-video", type: "video", label: "Guided practice video",
          content: { title: "A guided presence practice", videoLabel: "5-minute guided breathing video", caption: "" },
          personalization: {
            enabled: true,
            rules: [
              { id: "pr-j2v-1", segmentId: "seg-geo-soccer", value: "worldcup-arm", content: { title: "Find your calm before kickoff", videoLabel: "World Cup-themed presence video, timed around match days", caption: "Shown in soccer-heavy markets during the tournament window." } },
              { id: "pr-j2v-2", segmentId: "seg-device-mobile", value: "mobile-arm", content: { title: "A guided presence practice", videoLabel: "Vertical 5-minute guided breathing video (mobile cut)", caption: "" } },
            ],
            defaultValue: "default-arm",
            sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." },
          },
        },
        {
          id: "blk-j2-next", type: "next_step", label: "Where to next",
          content: { options: [{ label: "Continue to The Path of Stillness", targetJourneyId: "j1" }] },
          personalization: { enabled: false, rules: [], defaultValue: "default-arm", sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." } },
        },
      ],
    },
    {
      id: "j3", title: "The Path of Compassion", slug: "compassion",
      intro: "Open your heart through loving-kindness meditation and self-compassion practices.",
      status: "published", updatedAt: "2026-06-08T09:15:00Z", createdAt: "2026-05-02T11:30:00Z",
      topics: ["top-compassion", "top-belonging"],
      blocks: [
        {
          id: "blk-j3-hero", type: "hero", label: "Opening hero",
          content: { headline: "A space to belong", subhead: "Open your heart through loving-kindness.", media: "Two hands reaching toward each other" },
          personalization: { enabled: false, rules: [], defaultValue: "default-arm", sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." } },
        },
        {
          id: "blk-j3-text", type: "text", label: "Introduction",
          content: { body: "Open your heart through loving-kindness meditation and self-compassion practices." },
          personalization: {
            enabled: true,
            rules: [
              { id: "pr-j3t-1", segmentId: "seg-ref-anxiety-ad", value: "anxiety-arm", content: { body: "When it's hard to be kind to yourself, this practice starts smaller — just noticing the anxious voice, without needing to silence it yet." } },
              { id: "pr-j3t-2", segmentId: "seg-ref-belonging-ad", value: "belonging-arm", content: { body: "Compassion starts with belonging — to yourself first, then to everyone around you." } },
            ],
            defaultValue: "default-arm",
            sync: { status: "error", key: "journey-compassion-text", lastSyncedAt: "2026-07-27T16:40:00Z", message: "GrowthBook API error (401): invalid or expired API key." },
          },
        },
        {
          id: "blk-j3-prayer", type: "prayer_rotator", label: "Rotating prayer",
          content: { note: "Pulls a random prayer submitted by another visitor on every page load. This is resolved dynamically at request time — a different mechanism from segment-based personalization, so it isn't personalizable here." },
          personalization: null,
        },
      ],
    },
  ],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read saved state, reseeding.", e);
  }
  const seeded = structuredClone(SEED);
  persist(seeded);
  return seeded;
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
const listeners = new Set();

function notify() {
  persist(state);
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function nowIso() {
  return new Date().toISOString();
}

// ---------------- Experiments ----------------

export function listExperiments() {
  return state.experiments;
}

export function getExperiment(id) {
  return state.experiments.find((e) => e.id === id) || null;
}

export function createExperiment() {
  const exp = {
    id: uid("exp"),
    name: "Untitled experiment",
    status: "draft",
    hypothesis: "",
    linkedFeature: "",
    variants: [
      { name: "Control", isControl: true, weight: 50, description: "" },
      { name: "Variant", isControl: false, weight: 50, description: "" },
    ],
    metrics: { primary: "", secondary: [] },
    analysis: { differenceType: "Relative", dimension: "None" },
    appliesTo: [],
    sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." },
    results: { available: false, reason: "Not live yet — results appear once this experiment is running." },
    versions: [{ date: new Date().toLocaleString(), by: "You", status: "draft", current: true }],
    createdAt: nowIso(),
  };
  state.experiments.unshift(exp);
  notify();
  return exp;
}

export function updateExperiment(id, patch) {
  const exp = getExperiment(id);
  if (!exp) return;
  Object.assign(exp, patch);
  notify();
}

export function addExperimentVersion(id, status, by) {
  const exp = getExperiment(id);
  if (!exp) return;
  exp.versions.forEach((v) => delete v.current);
  exp.versions.unshift({ date: new Date().toLocaleString(), by: by || "You", status, current: true });
  notify();
}

export function deleteExperiment(id) {
  state.experiments = state.experiments.filter((e) => e.id !== id);
  notify();
}

// Calls the local server's /api/growthbook/sync route (see server.js +
// growthbook-server.js). The API key itself never reaches this browser code —
// the server decides real vs. simulated based on whether it has one configured.
export async function syncExperimentToGrowthBook(id) {
  const exp = getExperiment(id);
  if (!exp) return;
  const key = exp.sync.key || exp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  let result;
  try {
    const res = await fetch("/api/growthbook/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, name: exp.name, hypothesis: exp.hypothesis, status: exp.status }),
    });
    result = await res.json();
  } catch (err) {
    result = { ok: false, simulated: false, growthbookKey: key, message: "Could not reach the local server: " + err.message };
  }

  exp.sync = {
    status: result.ok ? (result.simulated ? "simulated" : "synced") : "error",
    key: result.growthbookKey || key,
    lastSyncedAt: nowIso(),
    message: result.message,
  };
  notify();
  return exp.sync;
}

// ---------------- Feature Flags ----------------

export function listFlags() {
  return state.flags;
}

export function getFlag(key) {
  return state.flags.find((f) => f.key === key) || null;
}

export function createFlag() {
  const flag = {
    key: uid("ff"),
    type: "Boolean",
    description: "",
    defaultValue: "false",
    environments: { Development: false, Staging: false, Production: false },
    linkedExperimentId: null,
    syncStatus: "not_synced",
    updatedAt: nowIso(),
  };
  state.flags.unshift(flag);
  notify();
  return flag;
}

export function updateFlag(key, patch) {
  const flag = getFlag(key);
  if (!flag) return;
  Object.assign(flag, patch, { updatedAt: nowIso() });
  notify();
}

export function toggleFlagEnvironment(key, envName) {
  const flag = getFlag(key);
  if (!flag) return;
  flag.environments[envName] = !flag.environments[envName];
  flag.updatedAt = nowIso();
  notify();
}

export function deleteFlag(key) {
  state.flags = state.flags.filter((f) => f.key !== key);
  notify();
}

export function renameFlagKey(oldKey, newKey) {
  const flag = getFlag(oldKey);
  if (!flag || getFlag(newKey)) return false;
  flag.key = newKey;
  flag.updatedAt = nowIso();
  notify();
  return true;
}

// ---------------- Segments ----------------
// Reusable population definitions. A segment says who a visitor is (geo,
// device, network, referral/campaign, day-time...); it carries no content
// of its own. Personalization rules on a block reference a segment by id.

export const SEGMENT_CATEGORIES = {
  geo: "Geography", device: "Device", network: "Network", referral: "Referral / campaign", daytime: "Day & time", custom: "Custom",
};

export const RULE_OPERATORS = {
  equals: "equals", not_equals: "does not equal", in: "is one of (comma-separated)", contains: "contains",
};

export function listSegments() {
  return state.segments;
}

export function getSegment(id) {
  return state.segments.find((s) => s.id === id) || null;
}

export function createSegment() {
  const seg = {
    id: uid("seg"),
    name: "Untitled segment",
    category: "custom",
    description: "",
    rules: [{ attribute: "country", operator: "equals", value: "" }],
  };
  state.segments.unshift(seg);
  notify();
  return seg;
}

export function updateSegment(id, patch) {
  const seg = getSegment(id);
  if (!seg) return;
  Object.assign(seg, patch);
  notify();
}

export function deleteSegment(id) {
  state.segments = state.segments.filter((s) => s.id !== id);
  notify();
}

// The Mongo-style condition object GrowthBook's SDKs evaluate against
// visitor attributes at request time — what turns a Segment's plain-English
// rules into something the delivery mechanism can actually match on.
export function segmentCondition(segment) {
  const exprs = segment.rules.map((r) => {
    if (r.operator === "equals") return { [r.attribute]: r.value };
    if (r.operator === "not_equals") return { [r.attribute]: { $ne: r.value } };
    if (r.operator === "in") return { [r.attribute]: { $in: r.value.split(",").map((v) => v.trim()).filter(Boolean) } };
    if (r.operator === "contains") return { [r.attribute]: { $regex: r.value } };
    return { [r.attribute]: r.value };
  });
  if (exprs.length === 0) return {};
  if (exprs.length === 1) return exprs[0];
  return { $and: exprs };
}

// ---------------- Topics ----------------
// A shared content taxonomy across pillars — orthogonal to Segments. A topic
// classifies content ("this is about grief"); a segment classifies a visitor
// ("this visitor is on mobile in India"). Today only Journeys carry topics;
// once Stories/Connect pillars exist as collections, they'd tag into the
// same list, which is what makes cross-pillar related-content lookups work.

export function listTopics() {
  return state.topics;
}

export function getTopic(id) {
  return state.topics.find((t) => t.id === id) || null;
}

export function createTopic() {
  const topic = { id: uid("top"), name: "Untitled topic", slug: "untitled-topic", description: "" };
  state.topics.unshift(topic);
  notify();
  return topic;
}

export function updateTopic(id, patch) {
  const topic = getTopic(id);
  if (!topic) return;
  Object.assign(topic, patch);
  notify();
}

export function deleteTopic(id) {
  state.topics = state.topics.filter((t) => t.id !== id);
  state.journeys.forEach((j) => { j.topics = j.topics.filter((tid) => tid !== id); });
  notify();
}

export function journeysForTopic(topicId) {
  return state.journeys.filter((j) => j.topics.includes(topicId));
}

// ---------------- Journeys ----------------

export function listJourneys() {
  return state.journeys;
}

export function getJourney(id) {
  return state.journeys.find((j) => j.id === id) || null;
}

export function experimentsForJourney(journeyId) {
  return state.experiments.filter((e) => e.appliesTo.some((a) => a.kind === "journey" && a.id === journeyId));
}

export function addJourneyTopic(journeyId, topicId) {
  const journey = getJourney(journeyId);
  if (!journey || journey.topics.includes(topicId)) return;
  journey.topics.push(topicId);
  notify();
}

export function removeJourneyTopic(journeyId, topicId) {
  const journey = getJourney(journeyId);
  if (!journey) return;
  journey.topics = journey.topics.filter((t) => t !== topicId);
  notify();
}

// Other content sharing at least one topic with this journey — the
// cross-pillar recommendation hook from Architecture Brief 3.1. Today this
// can only surface other Journeys (the only pillar built so far); a Stories
// or Connect pillar would extend this the same way, by tagging into the
// same Topics list and adding its own lookup alongside this one.
export function relatedJourneys(journeyId) {
  const journey = getJourney(journeyId);
  if (!journey) return [];
  return state.journeys.filter((j) => j.id !== journeyId && j.topics.some((t) => journey.topics.includes(t)));
}

// ---------------- Journey content blocks & personalization ----------------

export const BLOCK_TYPES = {
  hero: "Hero", video: "Video", text: "Text", prayer_rotator: "Rotating prayer (dynamic)", next_step: "Next step choice",
};

const BLOCK_DEFAULT_CONTENT = {
  hero: { headline: "New headline", subhead: "", media: "" },
  video: { title: "New video block", videoLabel: "", caption: "" },
  text: { body: "" },
  prayer_rotator: { note: "Pulls a random prayer submitted by another visitor on every page load. Resolved dynamically at request time — not personalizable by segment." },
  next_step: { options: [] },
};

function getBlock(journeyId, blockId) {
  const journey = getJourney(journeyId);
  if (!journey) return null;
  return journey.blocks.find((b) => b.id === blockId) || null;
}

export function addBlock(journeyId, type) {
  const journey = getJourney(journeyId);
  if (!journey) return null;
  const block = {
    id: uid("blk"),
    type,
    label: BLOCK_TYPES[type] || type,
    content: structuredClone(BLOCK_DEFAULT_CONTENT[type] || {}),
    personalization: type === "prayer_rotator" ? null : { enabled: false, rules: [], defaultValue: "default-arm", sync: { status: "not_synced", key: null, lastSyncedAt: null, message: "No sync attempted yet." } },
  };
  journey.blocks.push(block);
  notify();
  return block;
}

export function updateBlockContent(journeyId, blockId, patch) {
  const block = getBlock(journeyId, blockId);
  if (!block) return;
  Object.assign(block.content, patch);
  notify();
}

export function removeBlock(journeyId, blockId) {
  const journey = getJourney(journeyId);
  if (!journey) return;
  journey.blocks = journey.blocks.filter((b) => b.id !== blockId);
  notify();
}

export function moveBlock(journeyId, blockId, dir) {
  const journey = getJourney(journeyId);
  if (!journey) return;
  const i = journey.blocks.findIndex((b) => b.id === blockId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= journey.blocks.length) return;
  [journey.blocks[i], journey.blocks[j]] = [journey.blocks[j], journey.blocks[i]];
  notify();
}

export function setBlockPersonalizationEnabled(journeyId, blockId, enabled) {
  const block = getBlock(journeyId, blockId);
  if (!block || !block.personalization) return;
  block.personalization.enabled = enabled;
  notify();
}

export function addPersonalizationRule(journeyId, blockId, segmentId) {
  const block = getBlock(journeyId, blockId);
  if (!block || !block.personalization) return;
  const segment = getSegment(segmentId);
  block.personalization.rules.push({
    id: uid("pr"),
    segmentId,
    value: slugify(segment ? segment.name : "variant") + "-arm",
    content: structuredClone(block.content),
  });
  notify();
}

export function updatePersonalizationRule(journeyId, blockId, ruleId, patch) {
  const block = getBlock(journeyId, blockId);
  if (!block || !block.personalization) return;
  const rule = block.personalization.rules.find((r) => r.id === ruleId);
  if (!rule) return;
  if (patch.content) Object.assign(rule.content, patch.content);
  if (patch.segmentId !== undefined) rule.segmentId = patch.segmentId;
  if (patch.value !== undefined) rule.value = patch.value;
  notify();
}

export function removePersonalizationRule(journeyId, blockId, ruleId) {
  const block = getBlock(journeyId, blockId);
  if (!block || !block.personalization) return;
  block.personalization.rules = block.personalization.rules.filter((r) => r.id !== ruleId);
  notify();
}

export function movePersonalizationRule(journeyId, blockId, ruleId, dir) {
  const block = getBlock(journeyId, blockId);
  if (!block || !block.personalization) return;
  const rules = block.personalization.rules;
  const i = rules.findIndex((r) => r.id === ruleId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rules.length) return;
  [rules[i], rules[j]] = [rules[j], rules[i]];
  notify();
}

// Builds the exact GrowthBook v2 rules payload this policy maps to (one
// force rule per assignment-policy row, condition derived from the row's
// segment) and posts it through the local server, which owns the real API
// key. See growthbook-server.js#syncPersonalizationToGrowthBook for how
// this becomes a real `POST /v2/features` call.
export async function syncBlockPersonalization(journeyId, blockId) {
  const journey = getJourney(journeyId);
  const block = getBlock(journeyId, blockId);
  if (!journey || !block || !block.personalization) return;
  const p = block.personalization;
  const key = p.sync.key || `journey-${journey.slug}-${block.id.replace(/^blk-/, "")}`;

  const rules = p.rules.map((r) => {
    const segment = getSegment(r.segmentId);
    return {
      value: r.value,
      condition: JSON.stringify(segment ? segmentCondition(segment) : {}),
      description: segment ? segment.name : "",
    };
  });

  let result;
  try {
    const res = await fetch("/api/growthbook/sync-personalization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, description: `Personalization policy for "${block.label}" on ${journey.title}`, defaultValue: p.defaultValue, rules }),
    });
    result = await res.json();
  } catch (err) {
    result = { ok: false, simulated: false, growthbookKey: key, message: "Could not reach the local server: " + err.message };
  }

  p.sync = {
    status: result.ok ? (result.simulated ? "simulated" : "synced") : "error",
    key: result.growthbookKey || key,
    lastSyncedAt: nowIso(),
    message: result.message,
  };
  notify();
  return p.sync;
}

// ---------------- Misc ----------------

export function resetToSeed() {
  state = structuredClone(SEED);
  notify();
}
