---
updated: 2026-09-25
covers: [overview, navigation]
status: current
---

# Index — jsx-render (utilities-app)

The map of this repository. **Read this first, then jump to the files it points to.**

A tiny Node HTTP server that serves `pages/*.jsx` as server-rendered, browser-hydrated
React pages, plus a JSON API on Postgres. The live app is the **RECOMP training
dashboard** (`pages/recomp_v3.jsx`, served at `/`). A second service from the same image
is the **coach** — a Claude Code agent that reads/writes the training data through the API.

## Stack

- **Language / runtime:** JavaScript (ESM, `.mjs` only), **Node 24**. No TypeScript, no build step, no linter, no test runner.
- **Package manager:** npm (`package-lock.json`).
- **Run locally:** `PG*=… npm start` → http://localhost:3000 (needs a reachable Postgres with the DB already created; the server creates tables + seeds). See [recipes](recipes.md#run-locally).
- **Build:** none (esbuild compiles pages on demand, in-process — see [jsx](modules/jsx.md)).
- **Test:** no suite. Verify with `curl` against `/api/*`; drive Chrome with `playwright-core` (installed ad hoc) for UI. See [recipes](recipes.md#verify-a-change).
- **Lint / format / typecheck:** none configured.

## Components

Two runtime roles, one npm package, one Docker image. The coach talks to the server only over HTTP (`/api/*`) — that is the seam.

| Component | Path | Role | Purpose | Module page |
|-----------|------|------|---------|-------------|
| Pages server + API | `server.mjs` `jsx.mjs` `api.mjs` `db.mjs` `pages/` `seed/` | web service | SSR pages + JSON API on Postgres | [server](modules/server.md), [api](modules/api.md) |
| Coach | `coach/` | CLI + Claude Code agent | Reads/writes training data via the API; read-only DB role | [coach](modules/coach.md) |

Cross-component seam: the coach never imports server code — it calls `/api/*` (and reads via a SELECT-only DB role). See [architecture](architecture.md).

## Map

| Area | Key files / dirs | Purpose | More |
|------|------------------|---------|------|
| HTTP server | `server.mjs` | Page routing, SSR + hydration, `/` = `HOME_PAGE`, `/render`, `/health`, page cache | [server](modules/server.md) |
| JSX compiler | `jsx.mjs` | esbuild wrappers: expression pages, module pages, browser bundle | [jsx](modules/jsx.md) |
| JSON API | `api.mjs` | `/api/*` router + handlers (exercises, sets, plan, measurements, targets), validation | [api](modules/api.md) |
| Database | `db.mjs` | pg pool, `SCHEMA` (CREATE TABLE IF NOT EXISTS), idempotent `seed()` | [db](modules/db.md) |
| Pages / UI | `pages/*.jsx` `pages/_lib/recomp/` | One `.jsx` = one route; shared tokens/data/ui for RECOMP | [pages](modules/pages.md) |
| Seed data | `seed/` | Exercise catalog, per-exercise reference, the plan, SVG figures | [seed](modules/seed.md) |
| Coach | `coach/CLAUDE.md` `coach/bin/` `coach/.claude/skills/` | Coaching agent, its CLI tools and skills | [coach](modules/coach.md) |
| Scripts | `scripts/sql.mjs` `scripts/import-sesiones.mjs` | SQL runner, phone-notes importer | [recipes](recipes.md#run-sql) |
| Deploy | `Dockerfile` `docker-compose.yml` `.github/workflows/docker.yml` | GHCR image → Portainer stack `utilities-app` | [recipes](recipes.md#deploy) |

_Every "key files" cell holds real paths so an agent can open them directly._

## Where to start by task

- **Change what the dashboard shows** (swap an exercise, rebalance reps, add a measurement) → this is **data, not code**: an API call the coach makes. See [db](modules/db.md), [api](modules/api.md), and the note in [architecture](architecture.md#the-data-is-in-postgres-not-the-page).
- **Add or edit a page / UI** → [pages](modules/pages.md), [recipes](recipes.md#add-a-page); `pages/recomp_v3.jsx`, `pages/_lib/recomp/`.
- **Add an API route** → [recipes](recipes.md#add-an-api-route), [api](modules/api.md); `api.mjs` `routes` array.
- **Add / change a table or column** → [recipes](recipes.md#change-the-schema), [db](modules/db.md); `SCHEMA` in `db.mjs` (no migrations — `CREATE/ALTER … IF NOT EXISTS`).
- **Add an exercise / figure / plan seed** → [seed](modules/seed.md); `seed/`.
- **Work on the coach** → [coach](modules/coach.md); `coach/CLAUDE.md`, `coach/bin/`.
- **Run / debug locally** → [recipes](recipes.md#run-locally).
- **Deploy** → [recipes](recipes.md#deploy).

## Also see

- [architecture](architecture.md) — how the pieces fit together
- [conventions](conventions.md) — how to write code that matches this repo
- [glossary](glossary.md) — domain terms and key entities
- [log](log.md) — recent wiki changes

_The root `CLAUDE.md` and `README.md` are the authored references; this wiki is the compiled map. Where they disagree with code, the code wins._
