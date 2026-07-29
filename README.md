# hegetsus-admin — a real Payload CMS

A real, running [Payload CMS](https://payloadcms.com) 3 install — Topics, Journeys, and
Variant management for personalized content. This used to be a hand-built,
localStorage-backed mockup that only *looked* like a CMS admin; it now is one.

This is a standalone demo build, independent of `he-gets-us-cms` (the production CMS) —
it does not read from or write to that project or its database.

Experiments, Feature Flags, and Segments are intentionally not managed here — they
live in a separate experimentation/personalization platform, configured there
directly. Payload has no integration with that platform at all: it only stores
Variant content, keyed by a string an editor types in to match whatever key that
platform is configured to return for a rule. A separate proxy service reads
variants through Payload's normal API, decides which variant a visitor gets, and
serves the resolved content to the frontend.

## What's in here

- **Journeys** (`src/collections/Journeys.ts`) — content blocks (Hero, Video, Text,
  Rotating Prayer, Next Step — see `src/blocks/`). Journeys also carry **Topics**.
- **Variants** (`src/collections/Variants.ts`) — one document per rule/key, targeting
  one page and (optionally) one block on it. Scope is inferred from how far an editor
  drills in, not chosen explicitly:
  - No block picked → **page scope**: an ordered, filtered list of the page's
    existing blocks to show (blocks not listed are hidden).
  - A block picked, no field overrides → **block scope**: a visibility toggle +
    reorder position for that one block, leaving the rest of the page as authored.
  - A field override targets a text/media field → **field scope**: one or more
    override values (`overrideText`/`overrideMedia`), letting one document touch
    several fields at once.
  - A field override targets a list field (e.g. NextStep's `options`) → **list
    scope**: named alternatives (e.g. "control", "expanded"), each with its own
    replacement item list.
  A variant never authors new block content at page/block/field scope — it only
  reorders/filters/overrides the blocks already authored on the base Journey.
  Picking a page/block/field uses two custom components
  (`src/components/BlockPicker.tsx`, `FieldPicker.tsx`) that fetch the selected
  page's actual blocks live, rather than a static list.
- **Topics** (`src/collections/Topics.ts`) — a content taxonomy: what a piece of
  content is *about*.

## Run it

Needs a Postgres database to point at — e.g. a local one:

```sh
docker run -d --name hegetsus-pg \
  -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload -e POSTGRES_DB=hegetsus_admin \
  -p 5432:5432 postgres:16-alpine
```

Then:

```sh
cp .env.example .env   # fill in DATABASE_URI to match the db above, and a PAYLOAD_SECRET
pnpm install
pnpm dev
```

Open **http://localhost:3000/admin** and create the first admin user.

Note: the postgres adapter runs in `push: true` mode (auto schema sync, no migration
files). When a field is removed or renamed, `pnpm dev` will prompt interactively to
confirm dropping the affected column — since that prompt blocks a backgrounded dev
server, the simplest fix during active schema changes is to stop the server, drop and
recreate the database (or just the affected table), and restart.

## Project structure

```
src/
  payload.config.ts           Collections, postgres adapter
  collections/
    Users.ts                  Bare auth collection
    Media.ts                  Local-disk uploads (Hero/Video block images/video)
    Topics.ts                 Content taxonomy
    Journeys.ts                title/slug/intro/topics + blocks
    Variants.ts                 One doc per rule/key -- page/block/field/list scope
  blocks/                       Hero, Video, Text, RotatingPrayer, NextStep
  fields/
    block-key.ts                Shared "key" field factory (stable block identifier)
  lib/
    personalizable-fields.ts    Which fields of each block type can be overridden, and how
  components/
    BlockPicker.tsx              Picks one of a page's actual blocks (live-fetched)
    FieldPicker.tsx              Picks one of a block's personalizable fields
  app/(payload)/
    admin/[[...segments]]/          Payload's admin UI
    api/[...slug]/                  Payload's REST API
```

## Deploying

Runs on `@payloadcms/db-postgres`, so it's safe to deploy to a serverless platform like
Vercel — point `DATABASE_URI` at a real hosted Postgres instance (e.g. Neon, Vercel
Postgres) via the project's environment variables. `push: true` will sync the schema on
first boot against an empty database.
