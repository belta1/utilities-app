---
updated: 2026-09-25
covers: [seed, catalog, plan, figures]
status: current
---

# Seed data (`seed/`)

The source data the DB is bootstrapped from. Consumed only by [db](db.md)'s `seed()` — pages
cannot import `seed/`.

## Key files

- `seed/exercises.mjs` — `EXERCISES` (the ~81-row catalog: name, group, equipment, favorite,
  image key) and `slugify`.
- `seed/exercise-meta.mjs` — `EXERCISE_LOADS` (load ladder: start/target/note) and
  `EXERCISE_DETAIL` (muscles, steps, common error) per exercise name.
- `seed/exercise-svgs.jsx` — `buildSvgs(color, key)` + `SVG_KEYS`: the figures.
- `seed/exercise-svgs-extra.jsx` — `buildExtraSvgs(color)`: additional figures.
- `seed/plan.mjs` — `PLAN_DAYS`: the plan bootstrap (days, each with `exercises` and `core` lists).

## How it feeds the DB

`seed()` in [db](db.md) applies three policies (see that page for the full detail):

- **Images** — rendered from the `*-svgs*.jsx` files with `renderToStaticMarkup` and **upserted
  every start**. Change a figure → ships next deploy.
- **Exercises** — **insert-only** by slug; the seed also refreshes `image_key` and the
  reference material, but only where it has a value (coach-written values survive).
- **Plan** — inserted **once**, only when `plan_days` is empty. Never overwritten. Slots match
  the catalog by name; unmatched names keep `exercise_id` null (Les Mills / cycling placeholders).

## Gotchas & constraints

- **The plan seed never runs again** after the first bootstrap — editing `seed/plan.mjs` won't
  change a populated DB. To re-seed: `DELETE FROM plan_days;` then restart.
- Reference material and figures **belong to the exercise**, so a plan swap carries them along.
- Figures are `.jsx` because they're React SVG components rendered to string at seed time —
  that's why `db.mjs` uses `loadModuleFile` from [jsx](jsx.md).
- Note the split: the plan's *numbers* are DB rows, but the nutrition **text** (menu, macros,
  supplements, `POST_WORKOUT`) lives in `pages/_lib/recomp/data.jsx`, not here.

## Related

- [db](db.md), [pages](pages.md), [recipes](../recipes.md#add-an-exercise--figure--plan-seed)
