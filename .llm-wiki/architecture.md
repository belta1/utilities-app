---
updated: 2026-09-25
covers: [architecture]
status: current
---

# Architecture

How this system fits together. High-level first; use [index](index.md) to reach specifics.

## Overview

A single Node HTTP server (`server.mjs`) does two jobs: it **serves React pages** from
`pages/*.jsx` (SSR + browser hydration, compiled on demand by esbuild — no build step) and
it **serves a JSON API** (`/api/*`) backed by Postgres. The flagship UI is the RECOMP
training dashboard (`pages/recomp_v3.jsx`) at `/`. A second service, the **coach**
(`coach/`), is Claude Code in Remote Control mode running from the *same image*; it is a
consumer of the API, not part of the server.

## Components

- **`server.mjs`** — the HTTP entry point. Routes: `/api/*` (delegated to `api.mjs`),
  `/health`, `POST /render`, `GET /<page>` (SSR) and `GET /<page>.js` (hydration bundle),
  `/` → `HOME_PAGE` (`recomp_v3`). Owns the compile cache keyed on the newest mtime under
  `pages/`. See [server](modules/server.md).
- **`jsx.mjs`** — esbuild wrappers that turn JSX into renderers: expression pages, module
  pages (bundled, React kept external so server + client share one React), and the browser
  hydration bundle. See [jsx](modules/jsx.md).
- **`api.mjs`** — a regex `routes` table + handlers; validation helpers; JSON in/out,
  unauthenticated. See [api](modules/api.md).
- **`db.mjs`** — the pg pool, the whole `SCHEMA` string, and `seed()`. See [db](modules/db.md).
- **`pages/`** — the routes; `pages/_lib/` private modules (never served). See [pages](modules/pages.md).
- **`seed/`** — the exercise catalog, reference material, the plan bootstrap, SVG figures. See [seed](modules/seed.md).
- **`coach/`** — the coaching agent, its CLI (`coach/bin/`) and skills. See [coach](modules/coach.md).

## Data / control flow

Page request:
```
GET /            → HOME_PAGE (recomp_v3)
GET /<name>      → read pages/<name>.jsx → compile (cached) → renderToString → HTML doc
                   (+ <script src="/<name>.js"> for module pages)
GET /<name>.js   → esbuild browser bundle → hydrateRoot(#root)
```
The page then fetches its data **client-side** after mount:
```
useEffect → fetch("/api/…") → api.mjs handler → db.mjs query → Postgres → JSON
```
There is **no server-side data loading for pages** — query-string params arrive as string
props, everything else comes from `/api/*`.

## The data is in Postgres, not the page

The plan (`plan_days` / `plan_exercises`), each exercise's figure, load ladder and
execution detail (`exercises`), the coach's targets (`exercise_targets`) and the body
measurements (`body_measurements`) are all **rows**. `pages/recomp_v3.jsx` fetches them.
So changing what the dashboard shows — swap an exercise, rebalance reps, add a measurement
— is an **API call**, not a code edit and not a deploy. `recomp_v2.jsx` is the frozen
original and still hard-codes its copy. See [db](modules/db.md) and [glossary](glossary.md).

## Boundaries & external dependencies

- **Postgres** — the only external dependency at runtime. Connection via standard `PG*`
  env vars; the DB must already exist, the server creates tables + seeds on start.
- **The coach ⇆ server seam is HTTP only.** The coach calls `/api/*` (writes) and uses a
  SELECT-only DB role `coach_ro` for ad-hoc reads. It shares the Docker image but not the
  process. Keep `coach/CLAUDE.md`'s tool table and `coach/bin/*` in step when the API changes.
- **Pages are a leaf.** They may import files under `pages/` and packages from
  `node_modules`, but **cannot import `seed/`, `api.mjs` or `db.mjs`**.

## Key decisions & constraints (don't "fix" these)

- **No build step / no migrations / no tests / no linter / no TypeScript.** Pages compile
  on demand and cache against the newest `pages/` mtime, so an edit is live on next request.
- **Schema lives in one `SCHEMA` string** in `db.mjs` using `CREATE TABLE IF NOT EXISTS`
  and `ALTER … IF NOT EXISTS`. Changing a column = add an idempotent `ALTER` there.
- **Seed policy is deliberate** (see [seed](modules/seed.md)/[db](modules/db.md)): images +
  reference material refresh every start (only where the seed has a value); exercise rows
  are insert-only; the plan is inserted **once** (when `plan_days` is empty) and never again
  — a deploy must not undo a swap the coach made.
- **SSR-safe render** — no `window`/`document`/`Date`-based "today"/random during render;
  those go in `useEffect`, or hydration mismatches.
- **`keepAliveTimeout` is set high on purpose** (65s) so a response is never written into a
  socket being closed — that surfaces in the browser as a bare "Failed to fetch".
