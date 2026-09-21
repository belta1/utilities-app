# jsx-render

Serve `.jsx` files from a folder as interactive web pages, with a Postgres-backed
workout log behind `/api/*`. Built for the RECOMP training dashboard, usable for any
React page you want to drop in a folder and open in a browser.

- **No build step.** Put `page.jsx` in the pages folder, open `/page`. Edits show up on
  reload. esbuild transforms, `react-dom/server` renders, a tiny `node:http` server serves.
- **Interactive.** Pages are server-rendered, then hydrated in the browser, so `useState`,
  `onClick` and `fetch` work.
- **Workout log.** 81 exercises, each with an animated figure, all in Postgres. Log
  `kg × reps` per set from the training plan or from a free-form log tab.

```
Browser ──GET /recomp_v3──▶ server.mjs ──▶ pages/recomp_v3.jsx  (SSR + hydration bundle)
        ──/api/sets───────▶ api.mjs ─────▶ Postgres (exercises, exercise_images, workout_sets)
```

---

## Contents

1. [Quick start (local)](#1-quick-start-local)
2. [Deploy with Docker](#2-deploy-with-docker)
   - [Prerequisites on the server](#prerequisites-on-the-server)
   - [Option A — Portainer stack from GitHub](#option-a--portainer-stack-from-github)
   - [Option B — build the image on the server instead](#option-b--build-the-image-on-the-server-instead)
   - [Option C — docker compose on the host](#option-c--docker-compose-on-the-host)
   - [Updating](#updating)
3. [Configuration](#3-configuration)
4. [Pages](#4-pages)
5. [The RECOMP dashboard (recomp_v3)](#5-the-recomp-dashboard-recomp_v3)
6. [API](#6-api)
7. [Database](#7-database)
8. [Exercise figures](#8-exercise-figures)
9. [Project layout](#9-project-layout)
10. [Coach (Claude Code agent)](#10-coach-claude-code-agent)
11. [Troubleshooting](#11-troubleshooting)
12. [Security](#12-security)

---

## 1. Quick start (local)

Requires Node 24+ and a Postgres you can reach.

```sh
npm install
docker run -d --name pg -e POSTGRES_PASSWORD=pg -p 5433:5432 postgres:17-alpine   # if you have no Postgres
docker exec pg psql -U postgres -c "CREATE DATABASE recomp"                          # the server needs it to exist

PGHOST=localhost PGPORT=5433 PGDATABASE=recomp PGUSER=postgres PGPASSWORD=pg npm start
```

Open <http://localhost:3000> — `/` is the dashboard (`/recomp_v3`, set by `HOME_PAGE`).
On first start the server creates its tables and seeds the exercise catalog:

```
db ready: 83 images, 81 new exercises
jsx-render listening on http://localhost:3000  (pages: D:\jsx-render\pages)
```

---

## 2. Deploy with Docker

The server runs as one container. It needs:

- a **Postgres** container reachable on a shared Docker network (`pgnet`) as `postgres`,
  with a database named `recomp` that the `belta1` role can use;
- a **host folder** with the `.jsx` pages, bind-mounted read-only into the container;
- the **password** of the `belta1` role.

### Prerequisites on the server

Do these once, as a user with Docker access (`belta1` in the examples).

**1. Network and database.** The `pgnet` network must exist and the Postgres container
must be attached to it with the name `postgres`:

```sh
docker network create pgnet                       # skip if it already exists
docker network connect pgnet postgres             # skip if already attached
docker network inspect pgnet --format '{{range .Containers}}{{.Name}} {{end}}'   # should list: postgres
```

Create the database if you haven't already. The server creates its own tables on first
start, so an empty database is all it needs:

```sh
docker exec postgres psql -U belta1 -c "CREATE DATABASE recomp"
```

A different role or database name works too — set `PGUSER` / `PGDATABASE`.

**2. Push the repository to GitHub** (only for the Portainer options):

```sh
git add -A
git commit -m "jsx-render"
git remote add origin https://github.com/<you>/jsx-render.git
git push -u origin main
```

`.env` is gitignored, so no password ever reaches GitHub.

### Option A — Portainer stack from GitHub

Portainer clones the repository on the server and pulls the image that GitHub Actions
publishes on every push to `main` (`ghcr.io/<you>/jsx-render:latest`). Works on Docker
standalone environments and Swarm alike; nothing is built on the server.

1. Push the repo (step 3 above) and wait for the **docker image** workflow to go green
   under the *Actions* tab. The first run creates the package **private**, even when the
   repository is public, and a private package cannot be pulled anonymously. Either make
   it public — *your profile → Packages → jsx-render → Package settings → Change
   visibility* — or keep it private and give Portainer a registry credential
   (*Registries → + Add registry → Custom*, URL `ghcr.io`, username your GitHub user,
   password a PAT with only the `read:packages` scope). A token alone, without one of
   these two, does nothing: Portainer does not use the host's `docker login`.
2. In Portainer open your environment → **Stacks** → **+ Add stack**.
3. **Name:** `jsx_server`.
4. **Build method:** **Repository**.
5. **Repository URL:** `https://github.com/<you>/jsx-render`
   **Repository reference:** `refs/heads/main`
   **Compose path:** `docker-compose.yml`
   Only if the repository is private, enable **Authentication** and paste a GitHub
   personal access token (classic, `repo` scope) as the password.
6. **Environment variables** → **+ Add an environment variable**. `PGPASSWORD` is
   required; the rest only if your setup differs from the defaults:

   | Name | Value |
   |---|---|
   | `PGPASSWORD` | password of the `belta1` Postgres role |
   | `IMAGE` | *(only if the repo is not `belta1/exercise-app`)* `ghcr.io/<you>/<repo>:latest` |
   | `COACH_PGPASSWORD` | password of the read-only `coach_ro` role (section *Coach*) |
   | `PGUSER` | *(optional)* Postgres role, default `belta1` |
   | `PGDATABASE` | *(optional)* database name, default `recomp` |
   | `PGSSLMODE` | *(optional)* `no-verify` (default, TLS), `require`, or `disable` if Postgres has no TLS |
   | `PORT` | *(optional)* host port, default `3000` |

7. *(Optional)* **GitOps updates** → enable **Polling** (e.g. every 5 minutes) so a
   `git push` redeploys the stack automatically. Or enable **Webhook** and add the
   generated URL to the GitHub repo under *Settings → Webhooks*.
8. **Deploy the stack.** The container log should end with:

   ```
   db ready: 83 images, 81 new exercises
   jsx-render listening on http://localhost:3000  (pages: /app/pages)
   ```

9. Open `http://<server>:3000/recomp_v3`.

To update later: **Stacks → jsx_server → Pull and redeploy** (the *Re-pull image* toggle
is what fetches the new image). Give Actions a minute after the push first, or you'll
redeploy the previous image.

### Option B — build the image on the server instead

If you'd rather not depend on GHCR, build locally. The compose file has both `image:`
and `build: .`, so `--build` produces the same image from the checkout:

```sh
docker compose up -d --build
```

In Portainer, a Git stack cannot do this through *Pull and redeploy* — that path only
pulls. Build on the host as above, or tag the local build as the `IMAGE` the stack expects.

### Option C — docker compose on the host

```sh
git clone https://github.com/<you>/jsx-render.git
cd jsx-render
cp .env.example .env && nano .env        # set PGPASSWORD
docker compose up -d --build
docker compose logs -f jsx_server
```

### Updating

**Everything in the repository ships together.** Pages, server code, seed data, figures,
the coach's manual, skills and tools are all in the image, so there is one update path
and no way for the page and the API it calls to drift apart:

| What changed | What to do |
|---|---|
| Anything in the repo — a page, server code, seed data, figures, the coach | `git push` → wait for the Actions build → Portainer: **Pull and redeploy** (*Re-pull image* on), or GitOps polling; with compose on the host: `docker compose up -d --build`. Startup re-runs the seed. |
| The plan, targets, measurements | Nothing to deploy — they are rows. The coach writes them through the API and the dashboard shows them on the next page load. |
| Exercise names or groups | Edit rows in the `exercises` table; the seed does not overwrite them. |

While you are working on a page, `npm start` on your own machine serves `./pages`
directly and recompiles on the next request, so you don't redeploy to see an edit.

> **Upgrading from a bind-mounted setup.** Earlier versions mounted a host folder over
> `/pages` and pages were copied there by hand. That mount is gone from
> `docker-compose.yml`. In Portainer use **Pull and redeploy** (not *Restart*) so the
> compose file is refreshed from git as well as the image — otherwise the old mount
> survives and shadows the pages in the image. Afterwards
> `docker exec jsx_server ls /app/pages` should list your pages and
> `/home/belta1/docker_compose/config/jsx_server` can be deleted; a `PAGES_PATH` stack
> variable, if you set one, is now unused.

---

## 3. Configuration

All settings are environment variables. Locally they come from `.env` (see
[`.env.example`](.env.example)); in Portainer from the stack's environment variables.

| Variable | Default | Used by | Meaning |
|---|---|---|---|
| `PGHOST` | `postgres` | server | Postgres host — the container name on `pgnet` |
| `PGPORT` | `5432` | server | |
| `PGDATABASE` | `recomp` | server | Must already exist; tables are created by the server |
| `PGUSER` | `belta1` | server | Existing Postgres role with rights on `PGDATABASE` |
| `PGPASSWORD` | *(required)* | server | Password of `PGUSER` |
| `PGSSLMODE` | `no-verify` (compose) / unset (`npm start`) | server | `no-verify` = TLS, self-signed cert accepted; `require`/`verify-full` = TLS with certificate check; `disable` = plain TCP |
| `PORT` | `3000` | server + compose | Listen port; in compose, the host port that maps to the container |
| `PAGES_DIR` | `pages` (`/app/pages` in Docker) | server + coach | Folder the server reads pages from |
| `HOME_PAGE` | `recomp_v3` | server | Page served at `/` |
| `NODE_ENV` | `development` (`production` in Docker) | server | Production = minified browser bundle, React production build |
| `IMAGE` | `ghcr.io/belta1/exercise-app:latest` | compose | Image both services run; `docker compose up --build` builds it locally under this name instead |
| `COACH_PGPASSWORD` | *(required)* | compose (coach) | Password of the read-only `coach_ro` role |
| `COACH_PGUSER` | `coach_ro` | compose (coach) | Read-only role the coach uses for `sql` |
| `COACH_NAME` | `Coach RECOMP` | compose (coach) | Session title in claude.ai/code and the app |
| `TZ` | `America/Santiago` | compose (coach) | Local date for "today" |

---

## 4. Pages

Every `pages/<name>.jsx` is served at `GET /<name>`. Nested folders map to nested paths
(`pages/blog/post.jsx` → `/blog/post`). `GET /` serves `HOME_PAGE` (default `recomp_v3`).

**Live reload without a restart.** Files are re-read on every request; compiled output is
cached and invalidated whenever any file under the pages folder changes.

**Private modules.** A path segment starting with `_` is never served but can be imported:
`pages/_lib/recomp/tokens.jsx` is `import { T } from "./_lib/recomp/tokens.jsx"`.

**Props.** Query-string parameters arrive as string props: `/hello?name=Ada` →
`{ name: "Ada" }`.

### Two shapes of page

**Module page** — has `import`/`export`. Exports a component (or an element). Can import
relative files and anything in the server's `node_modules` (`react`, `react-dom`, plus
whatever you add to `package.json`). Server-rendered, then hydrated in the browser, so
hooks and event handlers work.

```jsx
import { useState } from "react";
export default function Counter({ start = "0" }) {
  const [n, setN] = useState(Number(start));
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

**Expression page** — just a JSX expression, with `props` and `React` in scope. Static
HTML, no JavaScript shipped. Good for templates.

```jsx
<ul>{[1, 2, 3].map((n) => <li key={n}>{n * 2}</li>)}</ul>
```

### Document wrapper

The page's output is wrapped in `<!doctype html><html><head>…</head><body>` with a
`viewport` meta and the page name as `<title>`, unless the page renders its own `<html>`.
Put global CSS in a `<style>` element inside the page (see `recomp_v3.jsx`).

### What is not supported

- `.tsx` (one-line loader change if you need it), CSS or image imports (needs a bundling step).
- Server-side data loading. Pages fetch from `/api/*` in a `useEffect` after mount.

---

## 5. The RECOMP dashboard (recomp_v3)

`pages/recomp_v3.jsx` is the training dashboard plus workout log.

**Everything with a number or a figure in it comes from the database** — the exercise
catalog and its figures, the plan day and its prescribed sets/reps/rest, each exercise's
load ladder and execution detail, the coach's targets, and the body measurements. The
page fetches `/api/plan`, `/api/measurements`, `/api/exercises`, `/api/sets` and
`/api/targets` after mount and renders what comes back. Swapping an exercise or
rebalancing a target is therefore a write to the DB: no page edit, no deploy. Only the
written content — weekly menu, macros, supplements, post-workout meals — still lives in
`pages/_lib/recomp/data.jsx`, shared with the older `recomp_v2.jsx` (kept unchanged, and
still rendering its own hard-coded copy of the plan).

| Tab | What it does |
|---|---|
| **TELEMETRIA** | Body composition from `body_measurements`: weight sparkline, a card per metric with its change since the previous measurement, and the 12-week goal bars. Empty until the first measurement is written (see the `medicion` coach skill). |
| **ENTRENO** | The weekly plan, from `plan_days` / `plan_exercises`. Tap an exercise card to open it: log `kg × reps` right there, see the sets done today as chips, "ultima vez" shows the previous session's sets, and the badge shows sets done vs planned (`2/4`). The load ladder and execution steps below the logger belong to the exercise, so a swap brings its own. |
| **REGISTRO** | Free-form log for any date. Type to search (accents ignored, any word order) or pick from the list — grouped by movement pattern (**EMPUJE**, **HALAR**, **PIERNA**, **CORE**; plan exercises first, marked ●), or **+ nuevo ejercicio**, add sets, delete with ✕. Shows sets / exercises / volume for the day, sets grouped by exercise, and a 60-day history — tap a day to jump to it. |
| **NUTRICION** | Weekly meal plan and supplements (unchanged from v2) |

Details worth knowing:

- Empty `kg` / `reps` fields submit the placeholder value, which is the previous set today
  or, failing that, the last set of the previous session. So logging a straight-sets
  workout is one tap per set.
- Dates are the browser's local date. Sets are stored by calendar day, not timestamp.
- Every exercise figure comes from the database (`exercise_images`), tinted with the
  day-type color through CSS `color` + `currentColor`.
- A plan slot with no catalog exercise (the Les Mills / cycling placeholders) is shown
  but cannot be logged — it has no `exercise_id`.

---

## 6. API

JSON over HTTP, no authentication. All dates are `YYYY-MM-DD`. Errors return
`{ "error": "…" }` with `400` (validation), `404` or `500`.

### Exercises

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/exercises` | Full catalog with inline `svg`. Favorites first, then `sort_order`. |
| `POST` | `/api/exercises` | Body `{ name, muscle_group?, equipment?, image_key? }`. Idempotent on name (slug). |
| `GET` | `/api/exercises/:id/last?before=DATE` | Sets from the most recent session strictly before `before` (or the latest overall if omitted). `null` if none. |
| `GET` | `/api/exercises/:id/sessions?before=DATE&limit=N` | The last N sessions (default 6, max 50) strictly before `before`, newest first, each `{ performed_on, sets: […] }`. What the coach's progression model reads. |
| `PATCH` | `/api/exercises/:id` | Body: any of `name`, `muscle_group`, `equipment`, `image_key`, `load_start`, `load_target`, `load_note`, `muscles`, `steps` (array), `common_error`. The reference material the training card shows. |
| `GET` | `/api/images` | The figure keys `image_key` may point at. |

### Sets

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/sets?date=DATE` | Sets logged that day, in logging order |
| `GET` | `/api/sets?from=DATE&to=DATE` | Inclusive range, newest day first |
| `POST` | `/api/sets` | Body `{ exercise_id, load_kg?, reps, rir?, date?, note? }` (`rir` = reps in reserve 0–5) or, for a timed set (plank), `{ exercise_id, load_kg?, duration_s, date?, note? }` — exactly one of `reps` / `duration_s`; `load_kg` defaults to 0. `date` defaults to today (server time). `set_number` is assigned: next number for that exercise on that day. |
| `PATCH` | `/api/sets/:id` | Body: any of `load_kg`, `reps`, `duration_s`, `rir`, `note` (sending `reps` or `duration_s` switches the set to that kind) |
| `DELETE` | `/api/sets/:id` | |

A set looks like:

```json
{
  "id": 42, "exercise_id": 1, "exercise_name": "Press banca con barra", "image_key": "press_banca",
  "performed_on": "2026-09-19", "set_number": 2, "load_kg": 42.5, "reps": 8,
  "duration_s": null, "rir": 2, "note": null, "logged_at": "2026-09-19T17:10:23.285Z"
}
```

Examples:

```sh
curl -s localhost:3000/api/exercises | jq '.[] | select(.is_favorite) | .name'
curl -s -X POST localhost:3000/api/sets -H 'content-type: application/json' \
  -d '{"exercise_id":1,"load_kg":42.5,"reps":8}'
curl -s "localhost:3000/api/sets?date=2026-09-19" | jq
```

### Targets

What to lift next time, one row per exercise, shown on the training tab's cards as
**OBJETIVO**. Written by the coach (`hoy --guardar`, or by hand with a reason).

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/targets` | All targets with `exercise_name`. |
| `PUT` | `/api/exercises/:id/target` | Body `{ load_kg?, reps?, reason?, set_by?, set_on? }` (at least one of `load_kg` / `reps`). Upserts. |
| `DELETE` | `/api/exercises/:id/target` | |

### Plan

The weekly plan the ENTRENO tab renders. `:day` is the day key — `lunes`, `martes`,
`miercoles`, `jueves`, `viernes`, `sabado`, `core`, `domingo`. A slot carries its
exercise's figure, load ladder and execution detail, so swapping `exercise_id` is all it
takes to change what the card shows.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/plan` | Every day with its slots, in plan order (main list first, then the core finisher). |
| `GET` | `/api/plan/:day` | One day. |
| `POST` | `/api/plan/:day/exercises` | Body `{ exercise_id?, name?, section?, position?, sets?, reps?, rest?, note? }`. `section` is `main` (default) or `core`; pass `exercise_id` and/or `name`. |
| `PATCH` | `/api/plan/exercises/:slotId` | Same keys. Passing `exercise_id` also renames the slot to the catalog name unless `name` is given — this is the swap. |
| `DELETE` | `/api/plan/exercises/:slotId` | |

### Measurements

Body composition, one row per measurement date, written from Samsung Health screenshots.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/measurements?limit=N` | The last N (default 24, max 200), **oldest first** — the chart's order. |
| `PUT` | `/api/measurements` | Body `{ measured_on, weight_kg?, body_fat_pct?, fat_mass_kg?, skeletal_muscle_kg?, bmi?, bmr_kcal?, body_water_kg?, protein_kg?, minerals_kg?, visceral_fat_level?, source?, note? }`. Upserts on `measured_on`; at least one metric required. |
| `DELETE` | `/api/measurements/:id` | |

### Other routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/` | The home page (`HOME_PAGE`, default `recomp_v3`) |
| `GET` | `/<name>` | Render a page; `/<name>.js` is its browser bundle |
| `POST` | `/render` | Render JSX from the request body (raw JSX, or JSON `{ jsx, props? }`). Returns bare HTML, no hydration. |
| `GET` | `/health` | `ok` |

---

## 7. Database

Created by `migrate()` in [`db.mjs`](db.mjs) on every start (`CREATE TABLE IF NOT EXISTS`).

```
exercise_images   key ─────────────┐   plain SVG per figure, currentColor strokes
                  svg, updated_at  │
                                   │
exercises         id, slug (unique), name, muscle_group, equipment,
                  is_favorite, sort_order, image_key ──┘, created_at,
                  load_start, load_target, load_note,     the card's CARGA block
                  muscles, steps text[], common_error     the card's MUSCULOS / EJECUCION
                    │ │
                    │ └── workout_sets    id, exercise_id, performed_on (date), set_number,
                    │                     load_kg numeric(6,2) ≥ 0,
                    │                     reps int > 0 | duration_s int > 0 (one of the two),
                    │                     rir smallint 0–5 (reps in reserve, optional),
                    │                     note, logged_at
                    │                     indexes: (performed_on), (exercise_id, performed_on)
                    ├── exercise_targets  exercise_id (PK), load_kg, reps text, reason,
                    │                     set_by, set_on, updated_at
                    └── plan_exercises    id, plan_day_id ─┐, section 'main'|'core', position,
                                          exercise_id (null = a cardio placeholder),
                                          name, sets, reps, rest, note, updated_at
                                                          │
plan_days         id ─────────────────────────────────────┘
                  key (unique: lunes…domingo, core), day, label, type, focus, source,
                  tip, post_key, is_optional, sort_order

body_measurements id, measured_on (date, unique), weight_kg, body_fat_pct, fat_mass_kg,
                  skeletal_muscle_kg, bmi, bmr_kcal, body_water_kg, protein_kg,
                  minerals_kg, visceral_fat_level, source, note, updated_at
```

**Seeding** runs after migration on every start and is safe to repeat:

- `exercise_images` — upserted from the figure sources, so a changed figure ships with the
  next deploy.
- `exercises` — inserted if the slug is new. Existing rows keep their `name`,
  `muscle_group`, `equipment`, `is_favorite` and `sort_order` (edit them freely in the DB).
  `image_key` is refreshed by the seed, and so is the reference material from
  `seed/exercise-meta.mjs` (`load_start`, `load_target`, `load_note`, `muscles`, `steps`,
  `common_error`) — but only where the seed has a value, so anything the coach filled in
  through `PATCH /api/exercises/:id` for an exercise the seed says nothing about survives.
- `plan_days` / `plan_exercises` — **bootstrap only**. `seed/plan.mjs` fills them the first
  time they are empty and never again; after that the database is the source of truth and
  the coach edits it through `/api/plan`, so a deploy cannot undo a swap. To start the plan
  over: `DELETE FROM plan_days;` and restart.
- `workout_sets` and `body_measurements` — never touched.

Useful queries:

```sql
-- volume per day, last 30 days
SELECT performed_on, count(*) AS sets, round(sum(load_kg * reps)) AS volume_kg
FROM workout_sets WHERE performed_on > current_date - 30
GROUP BY 1 ORDER BY 1 DESC;

-- best set per exercise
SELECT e.name, max(s.load_kg) AS max_kg
FROM workout_sets s JOIN exercises e ON e.id = s.exercise_id
GROUP BY 1 ORDER BY 2 DESC;

-- promote an exercise to the PLAN group in the picker
UPDATE exercises SET is_favorite = true, sort_order = 5 WHERE slug = 'dominadas';

-- what the plan prescribes on a given day
SELECT p.id AS slot, p.section, p.name, p.sets, p.reps, p.rest
FROM plan_exercises p JOIN plan_days d ON d.id = p.plan_day_id
WHERE d.key = 'lunes' ORDER BY (p.section = 'core'), p.position;

-- body composition trend
SELECT measured_on, weight_kg, body_fat_pct, skeletal_muscle_kg
FROM body_measurements ORDER BY measured_on;
```

Backup: `docker exec postgres pg_dump -U belta1 recomp > recomp.sql`.

---

## 8. Exercise figures

Each exercise has a small animated stick figure (100×80 viewBox, floor line, body in the
accent color, colored joint dots: shoulder · elbow · knee · hip · wrist).

| File | Figures | Animation |
|---|---|---|
| [`seed/exercise-svgs.jsx`](seed/exercise-svgs.jsx) | 27 — extracted verbatim from `recomp_v2.jsx` | CSS `@keyframes` on groups |
| [`seed/exercise-svgs-extra.jsx`](seed/exercise-svgs-extra.jsx) | 56 — the rest of the catalog | SMIL `<animate>` tweening each limb between two poses |

At seed time each figure is rendered to plain SVG with `currentColor` in place of the
accent, and stored in `exercise_images`. The UI injects it and sets CSS `color`.

**Adding a figure** (in `exercise-svgs-extra.jsx`):

```jsx
mi_ejercicio: { dur: 2.4, draw: ({ c, Limb, Joint, Head, Move }) => (
  <>
    <Floor />
    <Head c={c} a={[50, 15]} />
    <Limb c={c} a="50,22 50,44" w={3} />                       {/* static: torso */}
    <Limb c={c} a="50,24 52,50" b="50,24 76,26" />            {/* animated: pose a → b → a */}
    <Joint type="wrist" a={[52, 50]} b={[76, 26]} r={2.5} />  {/* joints tween too */}
  </>
) },
```

`a`/`b` are polyline point lists with the same number of points. `Move dx dy` translates a
group (bars, dumbbells), `Rot deg x y` rotates one, `Disc` is a side-view plate. Then add
the exercise to `seed/exercises.mjs` with the same key as its slug (or pass the key
explicitly), and redeploy — the seed picks it up.

To preview figures without the app, render them into an HTML grid and open it in a
browser (the seed code runs anywhere Node does):

```js
import { loadModuleFile } from "./jsx.mjs";
import { renderToStaticMarkup } from "react-dom/server";
const { buildExtraSvgs } = await loadModuleFile("seed/exercise-svgs-extra.jsx");
console.log(renderToStaticMarkup(buildExtraSvgs("#E0853C").dominadas));
```

---

## 9. Project layout

```
server.mjs              HTTP server: page routes, /render, bundles, cache; runs migrate + seed on boot
jsx.mjs                 esbuild wrappers: expression / module / file compile, browser bundle
api.mjs                 /api/* routes and validation
db.mjs                  pg pool, schema, seed
seed/
  exercises.mjs         exercise catalog (name, group, equipment, favorite, figure key)
  exercise-meta.mjs     per-exercise load ladder + execution detail, refreshed into `exercises`
  plan.mjs              the plan, inserted into plan_days/plan_exercises once (bootstrap only)
  exercise-svgs.jsx     27 original figures (from recomp_v2)
  exercise-svgs-extra.jsx  56 new figures + drawing helpers
pages/
  recomp_v3.jsx         the dashboard + workout log (plan and measurements from the API)
  recomp_v2.jsx         the original, unchanged (still renders its own copy of the plan)
  _lib/recomp/          tokens.jsx (colors), data.jsx (meals, macros, post-workout), ui.jsx (shared tabs)
  hello.jsx, list.jsx   minimal examples of the two page shapes
scripts/sql.mjs         run SQL with the PG* env vars from a machine without psql
scripts/import-sesiones.mjs   load a phone-notes training log (see header) through the API; dry run by default
coach/                  the Claude Code coaching agent (manual, skills, tools, entrypoint) — section 10
CLAUDE.md               working notes for Claude Code (skills live user-wide in ~/.claude/skills/)
Dockerfile              node:24-alpine, production
docker-compose.yml      pulls the published image (Portainer Option A); `--build` builds it (Option B / C)
.github/workflows/docker.yml   builds + pushes ghcr.io/<you>/jsx-render on push to main
```

How a request for `/recomp_v3` is served:

1. `pageFile()` maps the URL to `pages/recomp_v3.jsx` (refusing `..`, `_` segments, null bytes).
2. The file is bundled for Node with esbuild (relative imports resolved, `react` kept
   external so it is the server's instance) and evaluated; cached by the folder's newest mtime.
3. `renderToString` produces the HTML, wrapped in a document with `<div id="root">`, the
   props as JSON, and `<script type="module" src="/recomp_v3.js">`.
4. `/recomp_v3.js` is a second esbuild bundle (react + react-dom + the page, for the
   browser) that calls `hydrateRoot`. Also cached.

---

## 10. Coach (Claude Code agent)

`coach/` is a Claude Code project that coaches the plan from your phone: what to train
today with load targets computed from the log, logging sets from free text, weekly
reviews, importing phone notes. It runs as the `coach` service — same image as the
server, [Remote Control](https://code.claude.com/docs/en/remote-control) server mode,
unprivileged user, read-only access to the app code, the pages and the database; it
writes only to its own `coach_data` volume and, through the API, to the workout log.

```
phone / claude.ai/code ──Remote Control──▶ coach container ──▶ http://jsx_server:3000/api/*
                                                             ──▶ postgres (role coach_ro, SELECT only)
                                                             ──▶ /app/pages (nutrition content, read-only)
```

What's inside: [`coach/README.md`](coach/README.md). The manual it follows:
[`coach/CLAUDE.md`](coach/CLAUDE.md).

### Setup (once)

1. **Read-only role** in Postgres (as `postgres`):

   ```sql
   CREATE ROLE coach_ro LOGIN PASSWORD '…';
   GRANT CONNECT ON DATABASE recomp TO coach_ro;
   \c recomp
   GRANT USAGE ON SCHEMA public TO coach_ro;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO coach_ro;
   ALTER DEFAULT PRIVILEGES FOR ROLE belta1 IN SCHEMA public GRANT SELECT ON TABLES TO coach_ro;
   ```

2. **Stack variable** `COACH_PGPASSWORD` (Portainer → stack → environment variables), then
   deploy. The `coach` container starts and waits — it logs
   `not signed in. Run: docker exec -it coach claude → /login` every minute until step 3.

3. **Sign in and consent**, from the host:

   ```sh
   docker exec -it coach claude      # accept the workspace-trust dialog, then: /login (opens a URL + code), then /exit
   docker attach coach               # the server starts; answer "y" to "Enable Remote Control?"
                                     # detach with Ctrl-p Ctrl-q  (Ctrl-C would stop it)
   ```

   Both are stored in the `coach_home` volume and survive redeploys. The session
   **Coach RECOMP** now appears at claude.ai/code and in the Claude app under Remote Control,
   for the account signed in (Pro/Max; API keys are not supported).

4. *(Optional)* previous conversations: copy them into the volume so the coach can read them —
   `docker cp chat.md coach:/coach/data/history/2026-08-plan.md` (any `.md`; keep them
   out of the repo). `data/PROFILE.md` is created from `coach/PROFILE.example.md` on
   first start; edit it in place the same way, or just tell the coach.

### Finding it in the app

Claude mobile app → **Code** tab → session list → **Coach RECOMP** (computer icon, green dot
when online). Or claude.ai/code in a browser. `docker logs coach --tail 20` on the server
prints the session URL; opening it lands directly in the session. It is one conversation,
shared by every device; the container keeps running when you close the app.

### What you can ask it

Talk to it in Spanish (or anything), plainly. Slash commands run a fixed routine; free
text works too — it recognizes what you mean and uses the same tools.

| You say | What it does | Behind the scenes |
|---|---|---|
| `/hoy` · "¿qué toca hoy?" · "¿qué hago el martes?" | The session for today's plan day (or the day you name), as a checklist: exercise → **target load × reps × series** → one cue, then the post-workout meal. On Fridays it says which rotation week it is. | Runs `hoy`: reads the plan from `GET /api/plan/:day`, the last sessions of each exercise from `GET /api/exercises/:id/sessions`, and rebalances load, reps/seconds and sets per exercise (rules below). |
| "ok, guarda los objetivos" · "de acuerdo" | Writes the targets so the training tab shows **OBJETIVO** on each card, and applies any change to the prescription itself (series, reps, seconds) to the plan. | `hoy --guardar` → `PUT /api/exercises/:id/target` (`set_by: hoy`) + `PATCH /api/plan/exercises/:slot`. |
| `/cambiar` · "cambia el remo con barra por remo en máquina" · "saca el peso muerto del miércoles" · "agrega face pull el viernes" | Confirms the slot and the replacement in one line, swaps it, then recomputes the target. **Visible on the dashboard immediately** — the card picks up the new exercise's figure, its CARGA ladder and its execution steps, because those live on the exercise. | `plan <día>` → `plan cambiar <slot> <ejercicio>` (`PATCH /api/plan/exercises/:slot`), then `hoy --day <día> --guardar`. |
| `/medicion` + a Samsung Health screenshot · "me pesé, 77.8" | Reads weight, body fat, skeletal muscle, BMI, BMR and body water off the image, asks **¿confirmo?**, writes one row for that date, and shows the change vs the previous measurement. It appears on the TELEMETRIA tab. It will not change any load because of a measurement. | `medir <fecha> peso=… grasa=… …` → `PUT /api/measurements` (upsert on the date). Also updates `data/PROFILE.md`. |
| "banca 40x8 x4 rir2" · "hice press militar 6.5 kg 10 10 9 10" · "plancha 60s x3" · "3 series de 12 con 15 en remo unilateral" | Parses sets, shows a table (exercise · kg · reps or s · RIR · n), asks **¿confirmo?**, logs them, reads the day back. If you gave no RIR it asks once ("¿cuántas te quedaban?"). Then tells you what those sets mean for next time. | `POST /api/sets` per set, `GET /api/sets?date=` after. Names are matched to the catalog (accents ignored); if ambiguous it asks with two options; unknown → offers `POST /api/exercises`. |
| "eso fue ayer" · "el martes hice…" | Same, for another date. | `date` in the body. |
| "borra la última serie" · "la S3 fueron 9 reps, no 8" | Fixes or deletes a set, after confirming which one. | `PATCH` / `DELETE /api/sets/:id`. |
| "¿cuánto pongo en peso muerto?" · "¿subo la banca?" | The target and the reason (rule + numbers: last sessions, e1RM trend, RIR). | Same model as `/hoy`, for one exercise. |
| "me duele la lumbar" · "dormí 5 horas" · "estoy de viaje sin barra" | Adjusts today's advice: substitutions the plan already has (deadlift → RDL con mancuernas), holds loads, and records the override with its reason so the dashboard shows it. Never coaches through sharp pain. | `PUT /api/exercises/:id/target` with `reason`; durable facts go to `data/PROFILE.md`. |
| `/revision` · "¿cómo voy?" · "resumen de la semana" | Adherence vs the plan's 6 days, volume by empuje / halar / pierna vs last week, PRs (e1RM ▲), stalled exercises with what it would change, plank trend; ends with ≤ 3 concrete changes or "sin cambios". Decisions are written to `data/history/coach-notes.md`. | `semana` (`--days 14` for two weeks, a date for a past week). |
| `/importar` + pasted phone notes (`[07:27, 9/1/2026]` … format) | Saves the paste to `data/notas/`, dry-runs the import, shows the mapping (your shorthand → catalog name), asks **¿aplico?**, imports. Re-running skips what is already logged. | `importar` → `scripts/import-sesiones.mjs` → `POST /api/sets`. |
| "¿qué dijimos sobre X?" · "¿por qué el plan no tiene dominadas?" | Answers from the earlier claude.ai conversation and its own notes. | Reads `data/history/*.md`. |
| "¿cuántas series de pierna hice en septiembre?" | Ad-hoc questions over the whole log. | `sql "select …"` as the read-only role, or the API. |
| "guarda esto en history/" + a pasted conversation | Keeps it for future context. | Writes under `data/history/`. |

What it will not do: invent a number that is not in the log or the plan; log anything —
a set, a plan change, a measurement — without showing it first and asking; change loads
because of a measurement; touch the app code or the database directly (SELECT only;
writes go through the API's validation). It *can* change the plan now, because the plan
is data: swaps, prescriptions and targets are writes to the DB, live on your next page
load. Changes to the app itself still go through the repo, noted under "App" in
`coach-notes.md`.

### How it chooses a load

`coach/bin/hoy.mjs` — deterministic, so the same history always gives the same target.
Per exercise, using the last sessions, how regularly it is actually trained, and the
plan's rep range (e.g. `6–8`). It rebalances three numbers: the load, the reps or
seconds, and sometimes the number of sets.

**Regularity first**, because a load that was right three weeks ago is not right now:

- No history at all → the exercise's own starting load (`load_start`, the card's INICIO).
- **28+ days** since that movement (or nothing in the last 28 days with history before) →
  reentry: −15 % and rebuild, and one set less this week on a 4-set exercise.
- **15–28 days** → repeat the last load and win the reps back before adding kg.

Then, on regular training (a session within the last two weeks):

1. **Stall** — best e1RM (Epley: load × (1 + reps/30), best set of a session) has not
   improved ≥ 1 % over the last 3 sessions → deload −10 % and rebuild. If the weight is
   too light to deload meaningfully (5 kg dumbbells, bodyweight), keep it and raise the
   rep range **in the plan** instead.
2. **Out of range** — every set above the range → at least one step up (or the e1RM load
   for top + 1 reps if higher); every set below → the e1RM load that leaves ~2 reps in
   reserve at the top of the range.
3. **Topped out** (every set at the top of the range) — with **RIR ≥ 2** logged → +1 step
   now; RIR 0–1 → repeat (the reps were forced); no RIR logged → +1 step only if the
   previous session also topped out.
4. Any set **under the bottom** of the range → −5 %.
5. **Volume** — trained 3+ times in four weeks, e1RM flat, and the plan only asks for 3
   sets or fewer → same load, one more set (written into the plan).
6. Otherwise **repeat** the load and add reps.

Steps: +2.5 kg barbell / cable / machine, +1 kg per dumbbell. Timed sets (planks) climb
5 s per session and, once the top of the range is held, the range itself moves up 5 s.
e1RM is only trusted up to 12 reps: on higher-rep ranges the reps are the target and the
load stays put. Every rule is a fixed point — running `hoy --guardar` twice changes
nothing the second time. Target effort is RIR 2; the last set of a compound may go to 1. `hoy` prints the rule it applied next
to each target, and the coach quotes it. Lines prefixed `plan:` are changes to the
prescription itself; `hoy --guardar` writes them, nothing else does.

### Operating it

- It restarts itself if the Remote Control server exits (network outage > 10 min) and
  Docker restarts the container on failure. If it is offline in the app:
  `docker logs coach --tail 20`.
- Changing `coach/CLAUDE.md`, skills or `bin/` = push → *Pull and redeploy* (it's in the
  image). Personal data is not in the image: `coach_data` keeps it.
- Updating Claude Code = rebuild the image (`ARG CLAUDE_VERSION`, default `latest` at build
  time) — every push does that.
- Reset the login: `docker volume rm exercise-app_coach_home` with the stack stopped.
- Copy its data out: `docker cp coach:/coach/data ./coach-data-backup`.

## 11. Troubleshooting

**`set PGPASSWORD` when deploying** — the compose file refuses to start without a
password. Add `PGPASSWORD` to the stack's environment variables (Portainer) or `.env`.

**`getaddrinfo ENOTFOUND postgres` / `ECONNREFUSED`** — the server can't reach Postgres.
Check `docker network inspect pgnet` lists both `postgres` and `jsx_server`. If your
Postgres container has another name, set `PGHOST` to it.

**`pg_hba.conf rejects connection for host "…", user "belta1", database "recomp", no encryption`**
— Postgres only accepts TLS (`hostssl`) from that network and the server connected in
plain TCP. Set `PGSSLMODE=no-verify` (the compose default; add it if you deploy another
way). `require` fails with `self-signed certificate` unless Postgres has a CA-signed
cert. The other fix is on the Postgres side: allow plain connections from the docker
network in `pg_hba.conf` (`host all all 192.168.32.0/20 scram-sha-256`, using the subnet
from `docker network inspect pgnet`), then `SELECT pg_reload_conf();`.

**`The server does not support SSL connections`** — the opposite case: Postgres has
`ssl=off`. Set `PGSSLMODE=disable`.

**`password authentication failed for user "belta1"`** — `PGPASSWORD` in the stack
variables doesn't match the role's password. Reset it:
`docker exec postgres psql -U postgres -c "ALTER USER belta1 PASSWORD 'new'"`.

**`database "recomp" does not exist`** — create it (see Prerequisites) or point
`PGDATABASE` at an existing one.

**`no page recomp_v3.jsx`** — the container is not running the image you think it is.
`docker exec jsx_server ls /app/pages` should list `_lib recomp_v3.jsx …`. If the stack
still bind-mounts a host folder over `/pages` from an older `docker-compose.yml`, pull
the latest repo revision in Portainer so the compose file itself is refreshed.

**The page ignores a change you deployed** — a stale image, or a leftover bind mount
shadowing `/app/pages`. Compare what the browser gets with the repo:
`curl -s http://<server>:3000/recomp_v3.js | grep -c api/plan` must be ≥ 1 on any build
that reads the plan from the database. `docker inspect jsx_server --format '{{.Image}}'`
and `docker exec jsx_server cat /app/pages/recomp_v3.jsx | head -3` settle it.

**Buttons do nothing** — the page is an expression page (no `export`), which is static by
design. Convert it to a module page with `export default`.

**`Failed to pull images of the stack … pull access denied for jsx_server, repository does
not exist or may require 'docker login'`** — the stack's compose file names an image that
no registry has (an older `docker-compose.yml` used `image: jsx_server:local` with
`build: .`), so *Re-pull image* can never succeed, whatever token you create. Pull the
latest repo revision in Portainer (**Pull and redeploy**, which also refreshes the compose
file) so the stack runs `ghcr.io/…:latest`.

**`ghcr.io/…: unauthorized` / `denied`** — the GHCR package is private (the default on
first push). Make it public, or add a `ghcr.io` registry in Portainer (see Option A).
Portainer ignores `docker login` done on the host.

**`docker build` fails with `failed to authorize … auth.docker.io … 401`** — the host has a
stale Docker Hub login (`docker info` shows a *Username*). `docker logout`; public base
images pull anonymously.

**Portainer: "build" not supported** — the environment is Swarm, or a remote agent
without build access. Not an issue with Option A, which only pulls; use `--build` only on the host.

**GitOps polling doesn't redeploy** — the compose file must change for Portainer to
redeploy; a page-only change doesn't need a redeploy anyway (copy it to the host folder).

**Figures don't animate** — the browser has *reduce motion* enabled. The CSS-keyframe
figures honor it (`prefers-reduced-motion` rule in the page); the SMIL ones don't. Nothing
is broken.

Logs: `docker logs -f jsx_server` (or the container's *Logs* tab in Portainer).

---

## 12. Security

This is a home-network tool. Read this before exposing it any further.

- **Pages are code.** `.jsx` files are compiled and executed inside the server process
  with full Node access, and `POST /render` executes whatever JSX is in the request body.
  Anyone who can write to the pages folder or reach `/render` can run code on the host.
- **The API has no authentication.** Anyone who can reach port 3000 can read and write
  the workout log.
- **Recommended:** keep port 3000 on the LAN or a VPN; if it must be reachable from the
  internet, put it behind a reverse proxy with authentication (Authelia, Caddy basic auth,
  Cloudflare Access…) and don't forward `/render`.
- The server only needs a role that can create tables in its own database. If `belta1`
  is a superuser, consider a dedicated role: `CREATE USER recomp WITH PASSWORD '…';`
  `ALTER DATABASE recomp OWNER TO recomp;` and set `PGUSER=recomp`.
