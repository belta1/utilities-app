# Log

Append-only record of changes to this wiki. Newest entries at the bottom. Each entry starts with a
fixed prefix so the log is greppable: `grep "^## \[" log.md | tail -5`.

Format: `## [YYYY-MM-DD] <init|update|lint> | <short summary>`

## [2026-09-25] init | Scanned repo (Node 24, ESM, npm; SSR-JSX server + Postgres API + coach agent). Created index, architecture, conventions, glossary, recipes, log + 7 module pages (server, jsx, api, db, pages, seed, coach). Generated CLAUDE.md/AGENTS.md/.github/copilot-instructions.md pointer blocks.
## [2026-09-25] update | Added week-aware session substitution ("HOY sugerido"): new daily_recommendation table (db.mjs), /api/recommendation GET/PUT/DELETE (api.mjs), weekly-coverage pass + substitution + --guardar/--limpiar in coach/bin/hoy.mjs, useRecommendation hook + banner in pages/recomp_v3.jsx, coach docs. Updated db/api/coach/pages/glossary pages.
