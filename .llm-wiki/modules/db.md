---
updated: 2026-09-25
covers: [db, schema, seed, postgres]
status: current
---

# Database (`db.mjs`)

The pg pool, the entire schema, and the seed. Postgres is the only runtime external dependency.

## Key files & entry points

- `db.mjs` — exports `pool`, `query`, `migrate`, `seed`, `planKey`.
- `migrate()` runs the `SCHEMA` string; `seed()` runs on every start (idempotent). Both are
  awaited in [server](server.md) before `listen`.
- Seed inputs come from [seed](seed.md): `seed/exercises.mjs`, `seed/exercise-meta.mjs`,
  `seed/plan.mjs`, `seed/exercise-svgs*.jsx`.

## Schema (the `SCHEMA` string — there are no migrations)

Tables: `exercise_images`, `exercises`, `workout_sets`, `plan_days`, `plan_exercises`,
`body_measurements`, `exercise_targets`, `daily_recommendation`. See [glossary](../glossary.md)
for what each means. `daily_recommendation` (one row per date) is a date-scoped pointer at a
plan day, written by `hoy` when the week's coverage is off — the recurring weekday plan is
never edited.

- **No migration tool.** New table → `CREATE TABLE IF NOT EXISTS`; new/changed column →
  `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (see the `workout_sets.duration_s` / `rir` and
  `exercises.load_*` / `muscles` / `steps` / `common_error` upgrades in the file). `SCHEMA`
  must stay fully idempotent — it runs on every start.
- The **database itself** (`PGDATABASE`) must already exist; only tables are managed here.

## Seed policy (deliberate — don't "simplify")

`seed()` runs every start inside one transaction:

1. **Images** — re-rendered from `seed/exercise-svgs*.jsx` and **upserted every start**, so a
   figure change ships with the next deploy.
2. **Exercises** — **insert-only** by slug, EXCEPT `image_key` and the reference material
   (`load_*`, `muscles`, `steps`, `common_error`), which the seed owns *wherever it has a
   value* (`coalesce(EXCLUDED.x, exercises.x)`) — so a coach-written value on an exercise the
   seed says nothing about survives every deploy.
3. **Plan** (`seedPlan`) — inserted **once**, only when `plan_days` is empty, and never again.
   A deploy must not undo a swap the coach made. Slots match the catalog by name; unmatched
   ones (Les Mills / cycling placeholders) keep `exercise_id` null.

To reset the plan to the seed: `DELETE FROM plan_days;` then restart.

## Gotchas & constraints

- **`numeric` → number:** `pg.types.setTypeParser(1700, Number)` so the API gets numbers, not
  strings. Dates go out as `YYYY-MM-DD` via `to_char` in [api](api.md).
- **Pool `error` listener** logs and swallows dropped-idle-client / TLS-reset errors so they
  don't take the process down mid-request. `max: 5` connections.
- Connection is entirely from `PG*` env vars (no config object). `PGSSLMODE=no-verify` for the
  deployed self-signed TLS.
- `planKey(day)` folds a day name to ascii and strips `+` (`Core+` → `core`) — the `plan_days.key`.

## Related

- [seed](seed.md), [api](api.md), [architecture](../architecture.md), [glossary](../glossary.md)
