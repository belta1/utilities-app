---
updated: 2026-09-25
covers: [api, routes, validation]
status: current
---

# JSON API (`api.mjs`)

The `/api/*` router and handlers. JSON in, JSON out, **unauthenticated** (the server is meant
to sit on a private network). Mounted by [server](server.md) via `handleApi`.

## Key files & entry points

- `api.mjs` — `handleApi(req, res, url, readBody)` (returns `true` if it handled the request),
  the `routes` table, all handlers, and the validation helpers.
- Reads/writes Postgres through `query` from [db](db.md).

## Routes (the `routes` array)

`[method, /regex/, handler]`; handler gets `(match, searchParams, body)`.

- **Exercises:** `GET/POST /api/exercises`, `PATCH /api/exercises/:id`,
  `GET /api/exercises/:id/last`, `GET /api/exercises/:id/sessions`, `GET /api/images`.
- **Sets:** `GET /api/sets?date=` or `?from=&to=`, `POST /api/sets`,
  `PATCH/DELETE /api/sets/:id`.
- **Plan:** `GET /api/plan`, `GET /api/plan/:key`, `POST /api/plan/:key/exercises`,
  `PATCH/DELETE /api/plan/exercises/:id`.
- **Measurements:** `GET /api/measurements?limit=`, `PUT /api/measurements`, `DELETE /api/measurements/:id`.
- **Targets:** `GET /api/targets`, `PUT /api/exercises/:id/target`, `DELETE /api/exercises/:id/target`.
- **Recommendation:** `GET /api/recommendation?date=`, `PUT /api/recommendation`, `DELETE /api/recommendation/:date` — the date-scoped "HOY sugerido" (validates `plan_key`/`source_key` against `plan_days`). Written by `hoy`; read by the dashboard.

## Validation & errors

- Helpers: `asDate` (YYYY-MM-DD), `asNumber` (opts `min`, `integer`; accepts `,` decimal),
  `asText` (opts `required`, `max`), `asTextArray`, `asRir` (0–5), `optional()` (null/"" = absent).
- Throw `ApiError(status, msg)` or `bad(msg)` (400). `handleApi` maps `err.status`, maps pg
  FK violation `23503` → 400, logs and hides 500s as `"internal error"`.
- Column sets are reused as SQL fragments (`EXERCISE_COLS`, `SET_COLS`, `PLAN_SLOT`, …).

## Domain rules encoded here (important)

- **A set is `reps` OR `duration_s`, never both** (`asSetMeasure` — timed sets, e.g. planks).
  `load_kg` defaults 0 (bodyweight). `set_number` auto-increments per (exercise, day).
  `PATCH` between reps/time clears the other column.
- **`rir`** (reps in reserve, 0–5) optional; drives the coach's progression.
- **Plan swap:** `PATCH /api/plan/exercises/:id` with `exercise_id` renames the slot to the
  catalog name (unless a `name` is passed); the card's figure/load/detail follow because
  they're columns on `exercises`. A slot may keep `exercise_id` null (placeholders).
- **`PLAN_SLOT` embeds the exercise's figure + load ladder + detail** in each slot's JSON so
  the page needs no second lookup.
- **Measurements upsert on `measured_on`**; `GET /api/measurements` returns **oldest first**
  (`.reverse()`) — the only endpoint that does (sparkline order).
- **`exercise_targets`** is one row per exercise, overwritten not appended (`putTarget`).

## Gotchas & constraints

- Bodies must be a JSON object for POST/PATCH/PUT; parse errors → `bad("body must be JSON")`.
- No auth, no rate limiting — keep it behind the private network.
- **When you change routes, update `coach/CLAUDE.md`'s tool table** and any `coach/bin/*` wrapper.

## Related

- [db](db.md), [server](server.md), [coach](coach.md), [glossary](../glossary.md)
