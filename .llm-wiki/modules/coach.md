---
updated: 2026-09-25
covers: [coach, agent, cli]
status: current
---

# Coach (`coach/`)

A second service from the same image: **Claude Code in Remote Control server mode**, acting as
JF's strength coach. It is a *consumer* of the API — not part of the server process.

## Key files & entry points

- `coach/CLAUDE.md` — the coach's operating manual and **tool table** (the authoritative list
  of what CLI/API calls it uses). Keep it in step with [api](api.md).
- `coach/bin/` — the CLI tools on PATH inside the container: `hoy`, `semana`, `plan`, `medir`,
  `importar`, `api`, `sql` (thin wrappers) with logic in `hoy.mjs`, `semana.mjs`, `plan.mjs`,
  `medir.mjs`.
- `coach/.claude/skills/` — the Spanish workflow skills: `hoy`, `registrar`, `cambiar`,
  `medicion`, `importar`, `revision`.
- `coach/entrypoint.sh`, `coach/README.md`, `coach/PROFILE.example.md`, `coach/HISTORY.md`.
- `coach/data/` — **gitignored**; the only place the coach writes (PROFILE, history, notas).

## How it works (the seam)

- The coach talks to the server **over HTTP** at `API_URL` (`http://jsx_server:3000`) — it
  never imports server code. Writes go through `/api/*`; ad-hoc reads use SQL through a
  **SELECT-only** DB role `coach_ro` (`scripts/sql.mjs` / its `sql` wrapper).
- **Progression logic lives in `coach/bin/hoy.mjs`** (regularity, e1RM, RIR, stall/deload),
  not in the server. `hoy --guardar` writes targets (`PUT /api/exercises/:id/target`) and
  applies plan changes (`/api/plan`).
- **Weekly coverage / substitution** (also `coach/bin/hoy.mjs`): `hoy` tallies which patterns
  (empuje/halar/pierna) + cardio the week owed by today vs what was trained (reusing
  `semana.mjs`'s `PATTERN` map). On a *light* calendar day (recovery/rest/cardio/optional core)
  with a gap, it substitutes the plan day that best fills it (strength beats cardio on a tie),
  rebalances that day, and — on `--guardar` — writes a `daily_recommendation` row the dashboard
  renders as "HOY sugerido". `hoy --limpiar` clears it. The weekday plan is never edited.
- The dashboard renders the DB, so anything the coach writes is live on JF's next page load.

## Gotchas & constraints

- **When you change the API, update `coach/CLAUDE.md`'s tool table and the `coach/bin/*`
  wrapper(s)** — they are the coach's only interface and drift silently.
- The coach role is read-only in SQL; all mutations must be API routes.
- Personal files never enter the repo (`coach/data/` gitignored). `PROFILE.example.md` is the template.
- Runs as user `node`, needs a TTY for the one-time Remote Control consent (see `docker-compose.yml`).
- Coach output is Spanish **with** accents (runtime text); page *code* copy is Spanish
  **without** accents — different rule, see [conventions](../conventions.md).

## Related

- [api](api.md), [db](db.md), [architecture](../architecture.md), [glossary](../glossary.md)
