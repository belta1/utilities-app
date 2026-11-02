# Log

Append-only record of changes to this wiki. Newest entries at the bottom. Each entry starts with a
fixed prefix so the log is greppable: `grep "^## \[" log.md | tail -5`.

Format: `## [YYYY-MM-DD] <init|update|lint> | <short summary>`

## [2026-09-25] init | Scanned repo (Node 24, ESM, npm; SSR-JSX server + Postgres API + coach agent). Created index, architecture, conventions, glossary, recipes, log + 7 module pages (server, jsx, api, db, pages, seed, coach). Generated CLAUDE.md/AGENTS.md/.github/copilot-instructions.md pointer blocks.
## [2026-09-25] update | Added week-aware session substitution ("HOY sugerido"): new daily_recommendation table (db.mjs), /api/recommendation GET/PUT/DELETE (api.mjs), weekly-coverage pass + substitution + --guardar/--limpiar in coach/bin/hoy.mjs, useRecommendation hook + banner in pages/recomp_v3.jsx, coach docs. Updated db/api/coach/pages/glossary pages.
## [2026-10-03] update | SetLogger is a <form> (phone Go/Enter submits) with a 4-session HISTORIAL (useRecentSessions → /api/exercises/:id/sessions); hoy.mjs: Friday rotation → lunes/martes as a kind:"rotation" recommendation, reps-only bodyweight progression (bodyweight(), withRange()), timed range catches up in one step, no deload on a self-lightened session. Updated coach/pages pages.
## [2026-10-03] update | Redesign "Goma y tiza": new tokens (slate + plate colors by movement pattern, Archivo with condensed NUM), new pages/_lib/recomp/kit.jsx primitives (Stepper, PlateRow, Ring, BottomNav…), recomp_v3.jsx and ui.jsx re-skinned with bottom navigation; behaviour unchanged. Updated conventions/pages pages and CLAUDE.md house style.
## [2026-10-06] update | SetLogger fixes (pages/_lib/recomp/kit.jsx, pages/recomp_v3.jsx): Stepper <input> now uses step="any" so any typed weight is accepted (native form validation no longer blocks non-multiples of 2.5/1; − / + still nudge by the step prop); RIR is now a Stepper instead of a 0–5 button grid, so it joins the Carga → Reps → RIR → Go keyboard flow. No wiki page claims changed.
## [2026-11-01] update | Calorie counting from photos: food_logs table (db.mjs), /api/food routes (api.mjs), coach `comida` CLI (coach/bin/comida.mjs) + `calorias` skill (ask-before-counting protocol, alimentos.md reference table), "Registrado hoy" block on the Comida tab (ui.jsx LoggedToday). Updated api/db/coach/pages pages.
## [2026-11-01] update | Comida tab: WeekFood weekly view (ui.jsx) — accumulated kcal vs goal of elapsed days, per-day bars, averages over logged days, week navigation; reads /api/food/days. Updated pages page.
