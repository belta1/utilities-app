---
updated: 2026-09-25
covers: [glossary, domain]
status: current
---

# Glossary

Domain terms and key entities. The domain is strength-training / body-recomposition
("RECOMP"). Data lives in Postgres tables defined in `db.mjs` (`SCHEMA`).

## Entities (tables)

- **exercise** (`exercises`) — a movement in the catalog (~81 rows). Carries name, slug,
  muscle group, equipment, its figure (`image_key` → `exercise_images.svg`), and the
  reference material shown on a card: load ladder (`load_start`/`load_target`/`load_note`),
  `muscles`, `steps[]`, `common_error`. See [seed](modules/seed.md), [db](modules/db.md).
- **workout_set** (`workout_sets`) — one logged set: `load_kg` + **either** `reps` **or**
  `duration_s` (timed, e.g. planks — never both), optional `rir`, `note`. `set_number` is
  per (exercise, day). See [api](modules/api.md).
- **plan_day** (`plan_days`) — one day of the training plan (`key`, `day`, `label`, `type`,
  focus, tip…). `key` is the day name folded to ascii with `+` stripped (`Core+` → `core`).
- **plan_exercise / slot** (`plan_exercises`) — one prescribed exercise in a plan day.
  `section` is `main` or `core`. `exercise_id` may be **null** — the Les Mills / cycling
  placeholders (shown, never logged). `name` is what the card shows.
- **exercise_target / OBJETIVO** (`exercise_targets`) — what to lift next time, one row per
  exercise, written by the coach (overwritten, never appended). Shown on the training card.
- **body_measurement** (`body_measurements`) — body composition, one row per day, upserted
  on `measured_on`, from a Samsung Health screenshot. `GET /api/measurements` returns
  **oldest first** (the only endpoint that does — the sparkline's order).
- **exercise_image** (`exercise_images`) — an SVG figure keyed by name; rendered from
  `seed/exercise-svgs*.jsx` and refreshed every start.
- **daily_recommendation / "HOY sugerido"** (`daily_recommendation`) — a date-scoped pointer
  (`recommended_on` → `plan_key` + `reason`) that says what to actually train today when it
  differs from the fixed weekly plan. Written by `hoy` when a movement pattern (empuje/halar/
  pierna) or cardio was missed this week and today is a light day; rendered as a banner in the
  dashboard's Training tab. Never mutates `plan_days`. See [coach](modules/coach.md).

## Concepts

- **RECOMP** — the training program / dashboard (`pages/recomp_v3.jsx`, at `/`).
  `recomp_v2.jsx` is the frozen original with hard-coded data.
- **RIR** — reps in reserve at the end of a set (0 = failure, 0–5). Optional; drives the
  coach's progression logic (`coach/bin/hoy.mjs`).
- **e1RM** — estimated 1-rep max, computed by the coach from logged sets for progression.
- **swap ("cambiar")** — replacing the exercise in a plan slot: one `PATCH
  /api/plan/exercises/:id` with an `exercise_id`. The card's figure, CARGA block and
  MUSCULOS/EJECUCION follow because they are columns on `exercises`.
- **target / OBJETIVO** — see `exercise_targets`; the coach writes it (`hoy --guardar` or
  `PUT /api/exercises/:id/target`).
- **module page vs expression page** — the two page kinds (see [conventions](conventions.md), [pages](modules/pages.md)).
- **the coach** — Claude Code agent (`coach/`) that reads/writes this data via the API;
  Spanish, phone-first, its own manual `coach/CLAUDE.md`.
- **jfubuntu** — the home server host the stack runs on (Portainer, Postgres, both services).
- **HOME_PAGE** — env-configured page served at `/` (default `recomp_v3`); there is no index listing.
