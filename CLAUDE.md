# jsx-render — guide for Claude

A tiny Node server that serves `pages/*.jsx` as server-rendered, browser-hydrated React
pages, plus a JSON API on Postgres. The first app on it is the RECOMP training dashboard
(`pages/recomp_v3.jsx`). The same server hosts any other web UI you drop into `pages/`.

The README is the reference (deploy, API, DB, figures, troubleshooting); this file is the
working knowledge that is not obvious from the code. Two user-wide skills (in
`~/.claude/skills/`, so they work from any project) cover the workflows: `new-webui`
(a new page or app on this server, with a page template) and `jfubuntu-postgres` (the
database engine: connect, create databases and roles, hba, backups, plus a SQL runner).

## Layout

```
server.mjs      http server: page routing, SSR + hydration bundle, "/" = HOME_PAGE, /render
jsx.mjs         esbuild wrappers: expression pages, module pages, browser bundle
api.mjs         /api/* router + handlers (exercises, sets); validation helpers
db.mjs          pg pool, SCHEMA (CREATE TABLE IF NOT EXISTS), idempotent seed()
seed/           exercise catalog + SVG figures rendered into the DB at startup
pages/          one .jsx = one route  (pages/foo.jsx → GET /foo, pages/a/b.jsx → /a/b)
pages/_lib/     private modules, importable but never served (any "_" path segment)
pages/_lib/recomp/{tokens,data,ui}.jsx   design tokens, plan/meal data, shared tabs
```

Node 24, ESM only (`.mjs`), no build step, no test runner, no TypeScript, no linter.

## Two kinds of page

- **Module page** (has `import`/`export`): `export default function Page(props)`. SSR'd
  with `renderToString`, then hydrated by a bundle served at `/<name>.js`. Hooks and
  handlers work. This is what every real UI is.
- **Expression page** (bare JSX, `props` and `React` in scope): static HTML, no JS.

Query-string params arrive as **string** props. Compiled output is cached against the
newest mtime under `pages/`, so any edit is live on the next request — no restart.

## Rules that keep pages working

- **SSR-safe render.** No `window`, `document`, `location`, `localStorage`, `Date`-based
  "today" or random values during render. Put them in `useEffect` (see `today` in
  `recomp_v3.jsx`) — otherwise hydration mismatches.
- **Data comes from `/api/*` after mount**, via `fetch` in `useEffect`. There is no
  server-side data loading for pages.
- **Self-contained styling.** Inline styles + one `<style>` block inside the page (fonts
  `@import`, resets, keyframes). No CSS/image imports — the bundler is not configured
  for them. Shared values go in `pages/_lib/<app>/tokens.jsx`.
- **Imports:** relative files under `pages/`, and packages from the server's
  `node_modules` (`react`, `react-dom`; add others to `package.json`). Pages cannot
  import `seed/`, `api.mjs` or `db.mjs` — in Docker, `/pages` is a separate mount.
- **Small, stable bundle.** Everything a page imports ships to the browser. Keep heavy
  data in the API, not in `_lib`.
- **Copy is Spanish, written without accents** (e.g. `musculo`, `ultima`, `Nutricion`),
  matching the existing pages. Labels use the `// SECTION_NAME` mono style.

## House style (RECOMP)

Tokens in `pages/_lib/recomp/tokens.jsx`: `T.bg #14110F`, `T.surface`, `T.raised`,
`T.line`, accents `T.copper` (strength / primary), `T.steel` (cardio), `T.sage`
(recovery / ok), `T.gold` (highlight), `T.lilac`; text `T.bone` / `T.ash` / `T.faint`.
Fonts: Space Grotesk (titles, values, buttons) + JetBrains Mono (labels, meta). Cards:
`background: T.surface`, `1px solid T.line`, radius 12–14, a 3px accent left border on
the "current" card, `.fadein` on tab switch. `/` serves `recomp_v3` directly (`HOME_PAGE`
in `server.mjs`); there is no index listing.

## Adding data / API

- Tables: append to `SCHEMA` in `db.mjs` with `CREATE TABLE IF NOT EXISTS` (+ indexes).
  There are no migrations; changing an existing column means an `ALTER … IF NOT EXISTS`
  statement in `SCHEMA`.
- Seeds: `seed()` runs on every start and must stay idempotent (upsert / insert-on-new).
- Routes: add `[method, /^\/api\/…$/, handler]` to `routes` in `api.mjs`. Handlers get
  `(match, searchParams, body)` and return JSON; throw `ApiError(status, msg)` or use
  `bad(msg)`; validate with `asDate` / `asNumber` / `asText`. Everything under `/api/`
  is JSON and unauthenticated — the server is meant to sit on a private network.
- `numeric` columns come back as numbers (type parser in `db.mjs`); dates go out as
  `YYYY-MM-DD` via `to_char`.
- A set is `reps` or `duration_s` (timed, e.g. planks), never both; the UI toggles REPS/SEG and
  defaults from the previous set or the plan ("seg" in the plan reps). `volume()` ignores timed sets.
  `rir` (reps in reserve, 0–5) is optional and drives the coach's progression.
- `exercise_targets` (one row per exercise) is what the training cards show as OBJETIVO; the
  coach writes it (`hoy --guardar` or `PUT /api/exercises/:id/target`). Progression logic lives
  in `coach/bin/hoy.mjs` (e1RM, RIR, stall/deload), not in the server.

## Scripts

- `node scripts/sql.mjs "<sql>" | -f file.sql [--json] [--no-tx]` — run SQL with the PG* env
  vars (no psql on Windows). See the `jfubuntu-postgres` skill for the engine itself.
- `node scripts/import-sesiones.mjs <file> [--apply]` — import a phone-notes log (WhatsApp
  "[HH:MM, M/D/YYYY]" headers, exercise / load / one line per set); dry run without `--apply`,
  aliases table inside for the shorthand names, skips (date, exercise) pairs already logged.

## Running locally

```sh
PGHOST=… PGPORT=… PGDATABASE=recomp PGUSER=… PGPASSWORD=… npm start   # http://localhost:3000
```

Needs a reachable Postgres with the database already created; the server creates
tables and seeds. Without Docker on this machine, `embedded-postgres` (npm) in a scratch
folder works for an ad-hoc DB. Verify a change with `curl` against `/api/*` and, for UI,
drive Chrome with `playwright-core` (installed ad hoc, not a project dependency) —
there is no test suite to run.

## Deploying (jfubuntu)

Two independent halves — deploying one does not deploy the other:

1. **Pages** are bind-mounted from the host folder
   `/home/belta1/docker_compose/config/jsx_server/` (`PAGES_PATH`). Copy the changed
   page **and `_lib/`** there (`scp -r pages/_lib pages/<name>.jsx belta1@jfubuntu:…`).
   Live on the next request.
2. **Server code** (`server.mjs`, `api.mjs`, `db.mjs`, `seed/`, `scripts/`, `coach/`) ships in the Docker
   image: push to `main` → GitHub Actions builds `ghcr.io/belta1/exercise-app:latest`
   (package is public) → Portainer, stack `utilities-app`: **Pull and redeploy**. Wait
   for the Actions run before pulling, or you redeploy the previous image.

The running stack: containers `jsx_server` on `:3000` and `coach` (the Claude Code coaching agent,
Remote Control server mode, same image; README → Coach), Postgres container `postgres` on
the `pgnet` network, TLS with a self-signed cert (`PGSSLMODE=no-verify`). Portainer is
on `:9000`, pgAdmin on `:443`. Credentials live in Portainer's stack env, never in the
repo. If a redeploy fails, read Portainer's own log first:
`docker logs --since 1h portainer | grep -i -E "error|denied"`.

## The coach (`coach/`)

A second service from the same image: Claude Code in Remote Control server mode, run as
`node`, with its own manual (`coach/CLAUDE.md`), skills and tools (`coach/bin`). It only
writes to `/coach/data` (volume) and to the log through the API; its DB role `coach_ro` is
SELECT-only. Its plan data comes from the live `/pages` mount, not the image. Personal
files (profile, imported conversations, phone notes) never enter the repo — `coach/data/`
is gitignored. When changing the API, keep `coach/CLAUDE.md`'s tool table and
`coach/bin/*.mjs` in step.

## Things that have bitten before

- "Failed to fetch" in the browser with a healthy server usually means the request
  never got a response: container restarting (startup fails if the DB is unreachable),
  or a stale page on the host folder. Check `/health` and compare `/recomp_v3.js`
  with the repo before touching the code.
- `docker compose pull` on a service with only a local `image:` name fails with
  "pull access denied" — the compose file must name a registry image.
- A stale Docker Hub login on the host (`docker info` → Username) breaks even public
  base-image pulls with 401; `docker logout` fixes it.
- Test rows written to the remote DB while debugging show up in the user's log — say
  so and delete them (`DELETE /api/sets/:id`).
