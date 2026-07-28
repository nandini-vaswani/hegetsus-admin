# Admin — Experiments, Feature Flags, Personalization, Analytics

A real, running admin app — not a static mockup. No build step, no npm install
required, no framework. Data persists in your browser's local storage, so
edits, new records, and deletions all survive a page reload.

## What's in here

- **Experiments** — A/B/n tests: variants with traffic-split weights,
  hypothesis, metrics, analysis settings, which content a test applies to,
  a Versions history, an API tab, and a real GrowthBook Sync (creates/updates
  a boolean feature via GrowthBook's v2 API).
- **Feature Flags** — standalone rollout switches with per-environment
  on/off state, optionally linked to an Experiment.
- **Journeys** — content blocks (Hero, Video, Text, Rotating Prayer, Next
  Step), each addable/reorderable/removable. Any block except the dynamic
  Rotating Prayer can be **personalized**: an ordered assignment policy maps
  Segments to Variants ("arms"), with a required default/fallback, a live
  preview of the exact GrowthBook payload it maps to, and a real GrowthBook
  Sync (creates/updates a string-valued feature with `force` targeting
  rules). Journeys also carry **Topics** and show **Related content** —
  other journeys sharing a topic.
- **Segments** — reusable visitor-population definitions (geography,
  device, network, referral/campaign), each with attribute rules and a
  live GrowthBook targeting-condition preview. Referenced by any number of
  personalized blocks.
- **Topics** — a content taxonomy independent of Segments: what a piece of
  content is *about*, not who sees it. Currently spans Journeys only; built
  so a future Stories or Connect pillar could tag into the same list.
- **Analytics** — a read-only sample dashboard (stat tiles, a 14-day chart,
  a funnel, an events table).
- **GrowthBook Sync** (Experiments and Personalization) — real, not
  simulated, when a `.env` (local) or the deployment's env vars supply
  `GROWTHBOOK_API_KEY` / `GROWTHBOOK_OWNER_EMAIL`; otherwise every sync
  button runs in an honest "demo mode" that simulates the response instead
  of silently failing.

## Run it

```sh
node server.js
```

Then open **http://localhost:5173**.

Requires Node 18+ (uses the built-in `fetch` and ES modules — no dependencies
to install).

## What's real vs. simulated

- **Everything in the UI is real**: creating, editing, deleting Experiments
  and Feature Flags; toggling environments; the Journeys ↔ Experiments
  relationship; all of it reads from and writes to an actual local data store
  (`src/lib/store.js`), persisted to `localStorage`.
- **"Sync to GrowthBook"** calls a real local server endpoint
  (`/api/growthbook/sync` in `server.js`). Until you connect a real GrowthBook
  account (see below), that endpoint runs in **demo mode** and returns a
  realistic simulated response instead of calling GrowthBook — you'll see
  that reflected honestly in the sync status ("Simulated") and in the sidebar
  ("GrowthBook: demo mode").
- **Analytics** is static sample data — in a real build this would embed
  GrowthBook's own analytics rather than reimplementing charts.

## Connecting a real GrowthBook account

1. In GrowthBook, create an API key with write access to Features:
   `Settings → API Keys` (or your account's equivalent).
2. Copy `.env.example` to `.env` in this folder:
   ```sh
   cp .env.example .env
   ```
3. Fill in `.env`:
   ```
   GROWTHBOOK_API_KEY=sk-your-real-key-here
   GROWTHBOOK_OWNER_EMAIL=your-growthbook-login-email@example.com
   ```
   `GROWTHBOOK_OWNER_EMAIL` is required — GrowthBook attributes every feature
   to an owner, and a plain API key (unlike a Personal Access Token) can't
   infer one, so the request needs it explicitly.
4. Restart the server (`node server.js`). The sidebar should now show
   "Connected to GrowthBook," and "Sync to GrowthBook" will make a real API
   call.

**The key never reaches the browser.** It's read server-side only, in
`growthbook-server.js`, exactly like the real CMS's Cloudflare tokens in
`purge-frontend-cache/route.ts`. `.env` is gitignored — never commit it, and
never paste a real key into chat or anywhere else outside this file.

This has been verified end-to-end against a real GrowthBook account: syncing
an experiment creates a real Feature in GrowthBook (`POST /api/v2/features`),
and syncing it again correctly detects it already exists and patches it
instead (`POST /api/v2/features/:id`).

## Project structure

```
index.html                    App shell — sidebar, topbar, mount point
server.js                     Local dev only: static file server + /api/growthbook/* routes
growthbook-server.js          Server-side-only GrowthBook API client (never sent to browser)
api/growthbook/               Vercel deploy only: the same routes as serverless functions
  status.js
  sync.js
  sync-personalization.js
src/
  main.js                     Routes, sidebar active-state, toast
  styles.css                  All styling
  lib/
    store.js                  Data layer: seed data, localStorage, CRUD
    router.js                 Minimal hash-based router
    ui.js                     Shared formatting/rendering helpers
  views/
    experiments.js            Experiments list + detail (Edit/Versions/API tabs)
    featureFlags.js           Feature Flags list + detail
    journeys.js                Journeys — content blocks, block-level personalization, Topics, Related content
    segments.js                Segments — reusable visitor-population definitions
    topics.js                  Topics — content taxonomy, cross-pillar
    analytics.js                Read-only analytics dashboard
```

`server.js` and `api/growthbook/*.js` both call the same functions in
`growthbook-server.js` — one process model for local dev (`node server.js`,
a persistent Node process), one for Vercel (stateless functions per
request). Nothing about the GrowthBook logic itself differs between them.

## Resetting sample data

Click "Reset sample data" at the bottom of the sidebar to wipe local edits
and restore the original seed data.
