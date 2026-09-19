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
   - [Option B — Portainer with a prebuilt image (GHCR)](#option-b--portainer-with-a-prebuilt-image-ghcr)
   - [Option C — docker compose on the host](#option-c--docker-compose-on-the-host)
   - [Updating](#updating)
3. [Configuration](#3-configuration)
4. [Pages](#4-pages)
5. [The RECOMP dashboard (recomp_v3)](#5-the-recomp-dashboard-recomp_v3)
6. [API](#6-api)
7. [Database](#7-database)
8. [Exercise figures](#8-exercise-figures)
9. [Project layout](#9-project-layout)
10. [Troubleshooting](#10-troubleshooting)
11. [Security](#11-security)

---

## 1. Quick start (local)

Requires Node 24+ and a Postgres you can reach.

```sh
npm install
docker run -d --name pg -e POSTGRES_PASSWORD=pg -p 5433:5432 postgres:17-alpine   # if you have no Postgres
docker exec pg psql -U postgres -c "CREATE DATABASE recomp"                          # the server needs it to exist

PGHOST=localhost PGPORT=5433 PGDATABASE=recomp PGUSER=postgres PGPASSWORD=pg npm start
```

Open <http://localhost:3000> — the index lists every page; `/recomp_v3` is the dashboard.
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

**2. Pages folder.** Copy the `pages/` directory to the host path that the compose file
mounts. The `_lib/` subfolder is required — `recomp_v3.jsx` imports from it.

```sh
mkdir -p /home/belta1/docker_compose/config/jsx_server
# from your workstation:
scp -r pages/* belta1@server:/home/belta1/docker_compose/config/jsx_server/
```

A different path works too — set `PAGES_PATH` (see [Configuration](#3-configuration)).

**3. Push the repository to GitHub** (only for the Portainer options):

```sh
git add -A
git commit -m "jsx-render"
git remote add origin https://github.com/<you>/jsx-render.git
git push -u origin main
```

`.env` is gitignored, so no password ever reaches GitHub.

### Option A — Portainer stack from GitHub

Portainer clones the repository on the server and builds the image there. No registry
needed. Works on Docker standalone environments (not Swarm).

1. In Portainer open your environment → **Stacks** → **+ Add stack**.
2. **Name:** `jsx_server`.
3. **Build method:** **Repository**.
4. **Repository URL:** `https://github.com/<you>/jsx-render`
   **Repository reference:** `refs/heads/main`
   **Compose path:** `docker-compose.yml`
   If the repository is private, enable **Authentication** and paste a GitHub personal
   access token (classic, `repo` scope) as the password.
5. **Environment variables** → **+ Add an environment variable**. `PGPASSWORD` is
   required; the rest only if your setup differs from the defaults:

   | Name | Value |
   |---|---|
   | `PGPASSWORD` | password of the `belta1` Postgres role |
   | `PGUSER` | *(optional)* Postgres role, default `belta1` |
   | `PGDATABASE` | *(optional)* database name, default `recomp` |
   | `PGSSLMODE` | *(optional)* `no-verify` (default, TLS), `require`, or `disable` if Postgres has no TLS |
   | `PAGES_PATH` | *(optional)* host folder with the pages, default `/home/belta1/docker_compose/config/jsx_server` |
   | `PORT` | *(optional)* host port, default `3000` |

6. *(Optional)* **GitOps updates** → enable **Polling** (e.g. every 5 minutes) so a
   `git push` redeploys the stack automatically. Or enable **Webhook** and add the
   generated URL to the GitHub repo under *Settings → Webhooks*.
7. **Deploy the stack.** The first deploy builds the image (about a minute). The
   container log should end with:

   ```
   db ready: 83 images, 81 new exercises
   jsx-render listening on http://localhost:3000  (pages: /pages)
   ```

8. Open `http://<server>:3000/recomp_v3`.

### Option B — Portainer with a prebuilt image (GHCR)

Use this if you'd rather not build on the server. The workflow in
[`.github/workflows/docker.yml`](.github/workflows/docker.yml) builds the image on every
push to `main` and publishes it to GitHub Container Registry as
`ghcr.io/<you>/jsx-render:latest`.

1. Push the repo (step 3 above). Wait for the **docker image** workflow to go green under
   the *Actions* tab. The first run also creates the package; make it public under
   *your profile → Packages → jsx-render → Package settings → Change visibility*, or keep
   it private and add a registry credential in Portainer (*Registries → + Add registry →
   Custom*, URL `ghcr.io`, username your GitHub user, password a PAT with `read:packages`).
2. Same as Option A, but **Compose path:** `docker-compose.ghcr.yml` and one more
   environment variable:

   | Name | Value |
   |---|---|
   | `IMAGE` | `ghcr.io/<you>/jsx-render:latest` |

3. Deploy. To update later: **Stacks → jsx_server → Pull and redeploy**.

### Option C — docker compose on the host

```sh
git clone https://github.com/<you>/jsx-render.git
cd jsx-render
cp .env.example .env && nano .env        # set PGPASSWORD
docker compose up -d --build
docker compose logs -f jsx_server
```

### Updating

| What changed | What to do |
|---|---|
| A page (`pages/*.jsx`) | Copy it to the host folder. No restart — the next request recompiles. |
| Server code, seed data, figures | Redeploy the stack (Portainer: *Pull and redeploy* / GitOps; compose: `up -d --build`). Startup re-runs the seed. |
| Exercise names or groups | Edit rows in the `exercises` table; the seed does not overwrite them. |

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
| `PAGES_DIR` | `pages` (`/pages` in Docker) | server | Folder the server reads pages from |
| `PAGES_PATH` | `/home/belta1/docker_compose/config/jsx_server` | compose | Host folder bind-mounted at `/pages` |
| `NODE_ENV` | `development` (`production` in Docker) | server | Production = minified browser bundle, React production build |
| `IMAGE` | — | `docker-compose.ghcr.yml` | Prebuilt image to run |

---

## 4. Pages

Every `pages/<name>.jsx` is served at `GET /<name>`. Nested folders map to nested paths
(`pages/blog/post.jsx` → `/blog/post`). `GET /` lists them all.

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

`pages/recomp_v3.jsx` is the training dashboard plus workout log. It shares the plan,
measurements, nutrition data and the TELEMETRIA / NUTRICION tabs with the original
`recomp_v2.jsx` through `pages/_lib/recomp/` (`tokens.jsx`, `data.jsx`, `ui.jsx`).
`recomp_v2.jsx` is kept unchanged.

| Tab | What it does |
|---|---|
| **TELEMETRIA** | Body measurements, weight trend, goals (unchanged from v2) |
| **ENTRENO** | The weekly plan. Tap an exercise card to open it: log `kg × reps` right there, see the sets done today as chips, "ultima vez" shows the previous session's sets, and the badge shows sets done vs planned (`2/4`). Suggested loads and execution steps are below the logger. |
| **REGISTRO** | Free-form log for any date. Type to search (accents ignored, any word order) or pick from the list — grouped by program day (**LUNES · EMPUJE**, **MARTES · HALAR**, …), then **CORE**, **PLAN · VARIANTES**, **OTROS**, or **+ nuevo ejercicio**, add sets, delete with ✕. Shows sets / exercises / volume for the day, sets grouped by exercise, and a 60-day history — tap a day to jump to it. |
| **NUTRICION** | Weekly meal plan and supplements (unchanged from v2) |

Details worth knowing:

- Empty `kg` / `reps` fields submit the placeholder value, which is the previous set today
  or, failing that, the last set of the previous session. So logging a straight-sets
  workout is one tap per set.
- Dates are the browser's local date. Sets are stored by calendar day, not timestamp.
- Every exercise figure comes from the database (`exercise_images`), tinted with the
  day-type color through CSS `color` + `currentColor`.

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

### Sets

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/sets?date=DATE` | Sets logged that day, in logging order |
| `GET` | `/api/sets?from=DATE&to=DATE` | Inclusive range, newest day first |
| `POST` | `/api/sets` | Body `{ exercise_id, load_kg, reps, date?, note? }`. `date` defaults to today (server time). `set_number` is assigned: next number for that exercise on that day. |
| `PATCH` | `/api/sets/:id` | Body: any of `load_kg`, `reps`, `note` |
| `DELETE` | `/api/sets/:id` | |

A set looks like:

```json
{
  "id": 42, "exercise_id": 1, "exercise_name": "Press banca con barra", "image_key": "press_banca",
  "performed_on": "2026-09-19", "set_number": 2, "load_kg": 42.5, "reps": 8,
  "note": null, "logged_at": "2026-09-19T17:10:23.285Z"
}
```

Examples:

```sh
curl -s localhost:3000/api/exercises | jq '.[] | select(.is_favorite) | .name'
curl -s -X POST localhost:3000/api/sets -H 'content-type: application/json' \
  -d '{"exercise_id":1,"load_kg":42.5,"reps":8}'
curl -s "localhost:3000/api/sets?date=2026-09-19" | jq
```

### Other routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/` | Index of pages |
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
                  is_favorite, sort_order, image_key ──┘, created_at
                    │
workout_sets      id, exercise_id ──┘, performed_on (date), set_number,
                  load_kg numeric(6,2) ≥ 0, reps int > 0, note, logged_at
                  indexes: (performed_on), (exercise_id, performed_on)
```

**Seeding** runs after migration on every start and is safe to repeat:

- `exercise_images` — upserted from the figure sources, so a changed figure ships with the
  next deploy.
- `exercises` — inserted if the slug is new. Existing rows keep their `name`,
  `muscle_group`, `equipment`, `is_favorite` and `sort_order` (edit them freely in the DB);
  only `image_key` is refreshed by the seed.
- `workout_sets` — never touched.

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
  exercise-svgs.jsx     27 original figures (from recomp_v2)
  exercise-svgs-extra.jsx  56 new figures + drawing helpers
pages/
  recomp_v3.jsx         the dashboard + workout log
  recomp_v2.jsx         the original, unchanged
  _lib/recomp/          tokens.jsx (colors), data.jsx (plan, meals, measurements), ui.jsx (shared tabs)
  hello.jsx, list.jsx   minimal examples of the two page shapes
Dockerfile              node:24-alpine, production
docker-compose.yml      build on host (Portainer Option A / compose)
docker-compose.ghcr.yml pull prebuilt image (Portainer Option B)
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

## 10. Troubleshooting

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

**`no page recomp_v3.jsx`** — the pages folder on the host is empty or mounted from the
wrong path. `docker exec jsx_server ls /pages` should list `_lib recomp_v3.jsx …`.
Check `PAGES_PATH`.

**500 with `Could not resolve "./_lib/recomp/tokens.jsx"`** — `_lib/` wasn't copied to
the pages folder.

**Buttons do nothing** — the page is an expression page (no `export`), which is static by
design. Convert it to a module page with `export default`.

**Portainer: "build" not supported** — the environment is Swarm, or a remote agent
without build access. Use Option B (prebuilt image).

**GitOps polling doesn't redeploy** — the compose file must change for Portainer to
redeploy; a page-only change doesn't need a redeploy anyway (copy it to the host folder).

**Figures don't animate** — the browser has *reduce motion* enabled. The CSS-keyframe
figures honor it (`prefers-reduced-motion` rule in the page); the SMIL ones don't. Nothing
is broken.

Logs: `docker logs -f jsx_server` (or the container's *Logs* tab in Portainer).

---

## 11. Security

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
