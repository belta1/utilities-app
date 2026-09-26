---
updated: 2026-09-25
covers: [recipes, how-to]
status: current
---

# Recipes

Step-by-step playbooks for the common tasks. Real commands for **npm / Node 24**. This repo
has **no build step, no test runner, no linter, no migrations** — don't reach for them.

## Run locally

Needs a reachable Postgres with the database already created; the server creates tables and
seeds on start.

```sh
npm install
PGHOST=… PGPORT=… PGDATABASE=recomp PGUSER=… PGPASSWORD=… npm start   # http://localhost:3000
```

Env knobs: `PORT` (default 3000), `PAGES_DIR` (default `pages`), `HOME_PAGE` (default
`recomp_v3`), `PGSSLMODE` (`no-verify` for self-signed TLS, `disable` if ssl off). See
`.env.example`. Without Docker, `embedded-postgres` (npm) in a scratch folder gives an
ad-hoc DB. Any edit under `pages/` is live on the next request (cache keys on newest mtime)
— no restart. Editing `server.mjs`/`api.mjs`/`db.mjs` needs a restart.

## Verify a change

There is no test suite.

```sh
curl -s http://localhost:3000/health
curl -s http://localhost:3000/api/exercises | head
curl -s -X POST http://localhost:3000/api/sets -H 'content-type: application/json' \
  -d '{"exercise_id":1,"load_kg":40,"reps":8,"rir":2}'
```

For UI, drive Chrome with `playwright-core` (install ad hoc; not a project dependency).
Compare `curl http://localhost:3000/recomp_v3.js` with the repo if a page misbehaves.
**Delete any test rows you wrote to a remote DB** (`DELETE /api/sets/:id`) and say so.

## Add a page

See [pages](modules/pages.md).

1. Create `pages/<name>.jsx`. Module page: `export default function Page(props){…}` (hooks,
   handlers, fetch from `/api/*` in `useEffect`). Expression page: bare JSX for static HTML.
2. Keep render SSR-safe (no `window`/`Date`-now/random during render — use `useEffect`).
3. Reuse `pages/_lib/recomp/{tokens,data,ui}.jsx` for RECOMP styling/content.
4. Visit `/<name>` — it compiles and caches automatically; module pages also serve `/<name>.js`.

## Add an API route

See [api](modules/api.md).

1. Write a handler in `api.mjs` `(match, searchParams, body) => result`; validate with
   `asDate`/`asNumber`/`asText`; throw `bad(msg)` / `ApiError(status, msg)`.
2. Append `["GET", /^\/api\/…$/, handler]` to the `routes` array.
3. Restart the server; verify with `curl`.
4. If the coach should use it, update `coach/CLAUDE.md`'s tool table (and `coach/bin/*` if a CLI wraps it).

## Change the schema

There are **no migrations**. See [db](modules/db.md).

1. Edit the `SCHEMA` string in `db.mjs`: new table → `CREATE TABLE IF NOT EXISTS …`
   (+ indexes); new/changed column → `ALTER TABLE … ADD COLUMN IF NOT EXISTS …`.
2. Keep it idempotent — `SCHEMA` runs on **every** start (`migrate()`).
3. If it needs seed data, extend `seed()` and keep it idempotent (upsert / insert-on-new).
4. Restart; the server applies `SCHEMA` then `seed()`.

## Change what the dashboard shows (data, not code)

The plan, targets and measurements are rows — write them via the API, they show on the next
page load. No deploy.

```sh
# swap the exercise in a plan slot (figure/load/detail follow the new exercise)
curl -X PATCH http://localhost:3000/api/plan/exercises/<slot> -H 'content-type: application/json' -d '{"exercise_id":12}'
# set the target shown on a card
curl -X PUT http://localhost:3000/api/exercises/<id>/target -H 'content-type: application/json' -d '{"load_kg":42.5,"reps":"6–8","reason":"…"}'
# add a measurement
curl -X PUT http://localhost:3000/api/measurements -H 'content-type: application/json' -d '{"measured_on":"2026-09-25","weight_kg":77.8}'
```

To reset the plan back to the seed: `DELETE FROM plan_days;` then restart. See [seed](modules/seed.md).

## Add an exercise / figure / plan seed

See [seed](modules/seed.md). Catalog rows in `seed/exercises.mjs`, reference material in
`seed/exercise-meta.mjs`, figures in `seed/exercise-svgs*.jsx`, plan bootstrap in
`seed/plan.mjs`. Exercise rows are insert-only; images + reference refresh on start; the
plan seeds only when `plan_days` is empty. A brand-new exercise can also be added live via
`POST /api/exercises` (no figure until the next deploy).

## Run SQL

No `psql` on Windows — use the runner (reads `PG*` env vars):

```sh
node scripts/sql.mjs "select count(*) from workout_sets"      # or -f file.sql, [--json], [--no-tx]
```

## Import a phone-notes log

```sh
node scripts/import-sesiones.mjs <file>            # dry run
node scripts/import-sesiones.mjs <file> --apply    # write; skips (date, exercise) already logged
```

## Deploy

One path ships the whole stack (pages are `COPY`d into the image — no bind mount). See [architecture](architecture.md).

1. Push to `main` → GitHub Actions (`.github/workflows/docker.yml`) builds and pushes
   `ghcr.io/belta1/exercise-app:latest` (package is public).
2. **Wait for the Actions run to finish**, or you redeploy the previous image.
3. In Portainer, stack `utilities-app`: **Pull and redeploy** with *Re-pull image* on.
   Use Pull-and-redeploy (not a plain restart) when `docker-compose.yml` itself changed.
4. Plan / targets / measurements are rows — nothing to deploy for those.

If a redeploy fails, read Portainer's own log first:
`docker logs --since 1h portainer | grep -i -E "error|denied"`. See [architecture](architecture.md) and root `CLAUDE.md` "Things that have bitten before".
