# coach/ — Coach RECOMP

A Claude Code agent that coaches the training plan from the phone (Remote Control),
using the app's API and database. It runs as the `coach` service in
`docker-compose.yml`, from the same image as the server.

- `CLAUDE.md` — the coaching manual Claude reads on every session.
- `.claude/skills/` — `/hoy`, `/registrar`, `/revision`, `/importar`.
- `.claude/settings.json` — what it may run without asking (its tools) and what it may
  never touch (app code, pages, its own manual).
- `bin/` — `hoy`, `semana` (deterministic plan/progression math), `api`, `sql`
  (read-only role), `importar`.
- `entrypoint.sh` — waits for a sign-in, then serves Remote Control; restarts on exit.
- `PROFILE.example.md` — copied to `data/PROFILE.md` on first start.
- `data/` — **personal, never committed** (gitignored): `PROFILE.md`, `history/`
  (earlier claude.ai conversations, `coach-notes.md`), `notas/` (phone logs). Lives in
  the `coach_data` volume.

First-time setup and day-to-day operation: README → *Coach*.
