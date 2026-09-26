---
updated: 2026-09-25
covers: [conventions, patterns]
status: current
---

# Conventions

How to write code that matches this repo. Derived from the actual code — the root
`CLAUDE.md` is the fuller authored reference; this is the short list agents need.

## Language & structure

- **ESM only, `.mjs`** for server code. No TypeScript, no build step, no bundler config
  beyond what `jsx.mjs` drives. Node 24.
- Server modules at the root: `server.mjs`, `jsx.mjs`, `api.mjs`, `db.mjs`. One concern each.
- **Pages:** `pages/foo.jsx` → `GET /foo`; `pages/a/b.jsx` → `/a/b`. Any path segment
  starting with `_` (e.g. `pages/_lib/`) is importable but never served.
- Two kinds of page (see [pages](modules/pages.md)): **module page** (has `import`/`export`,
  `export default function Page(props)`, SSR'd + hydrated) and **expression page** (bare
  JSX, static HTML, no JS).
- Shared page values (design tokens, meal/macro content, shared tabs) live in
  `pages/_lib/recomp/{tokens,data,ui}.jsx`. Keep heavy data in the API, not in `_lib` —
  everything a page imports ships to the browser.

## Tooling & config

- **Package manager:** npm — `npm install`, `npm start`. Add packages to `package.json`
  (`react`, `react-dom`, `pg`, `esbuild` are the deps).
- **No lint / format / typecheck config.** Match the surrounding style by hand.
- **Env:** standard `PG*` vars for the DB (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`,
  `PGPASSWORD`, `PGSSLMODE`). `PORT`, `PAGES_DIR`, `HOME_PAGE` tune the server. See `.env.example`.

## Patterns to reuse

- **API validation:** use the helpers in `api.mjs` — `asDate`, `asNumber`, `asText`,
  `asTextArray`, `asRir`, `optional()`. Throw `ApiError(status, msg)` or `bad(msg)` (400).
- **Adding a route:** append `[method, /^\/api\/…$/, handler]` to `routes` in `api.mjs`.
  Handlers get `(match, searchParams, body)` and return a JSON-serializable value.
- **DB access:** import `query` / `pool` from `db.mjs`. `numeric` columns come back as
  **numbers** (type parser in `db.mjs`); dates go out as `YYYY-MM-DD` via `to_char`.
- **Reference material on the exercise, not the plan slot** — swapping an exercise into a
  plan slot carries its figure, load ladder and execution detail because they are columns
  on `exercises`. See [db](modules/db.md).

## Error handling

- API errors: `throw new ApiError(status, msg)` (or `bad(msg)` for 400). The router in
  `handleApi` maps `err.status`, maps pg FK violation `23503` → 400, and hides 500s as
  `"internal error"` (logged server-side).
- The pg pool has an `error` listener (`db.mjs`) so a dropped idle client doesn't crash the
  process. `new URL(...)` in `server.mjs` is inside the try for the same reason.

## Copy / UI style (RECOMP)

- **Spanish, written without accents** in page copy (`musculo`, `ultima`, `Nutricion`).
  (The coach's own manual and Spanish output *do* use accents — that's runtime text, not code.)
- Design tokens in `pages/_lib/recomp/tokens.jsx` (`T.bg`, `T.surface`, accents
  `T.copper`/`T.steel`/`T.sage`/`T.gold`/`T.lilac`, text `T.bone`/`T.ash`/`T.faint`).
  Fonts: Space Grotesk (titles/values/buttons) + JetBrains Mono (labels/meta).
- Self-contained styling: inline styles + one `<style>` block per page. No CSS/image
  imports — the bundler isn't configured for them.

## Testing

- **No test suite.** Verify changes with `curl` against `/api/*`; for UI, drive Chrome with
  `playwright-core` (installed ad hoc, not a dependency). See [recipes](recipes.md#verify-a-change).

## Do / don't

- ✅ Keep `seed()` idempotent; keep `SCHEMA` changes as `IF NOT EXISTS`.
- ✅ Put render-time-varying values (today, random, `window`) in `useEffect`.
- ✅ When changing the API, update `coach/CLAUDE.md`'s tool table and `coach/bin/*`.
- ❌ Don't import `seed/`, `api.mjs` or `db.mjs` from a page.
- ❌ Don't hard-code plan/target/measurement data into a page — it's rows (write via API).
- ❌ Don't add a migration framework, a build step, or a test runner without being asked.
- ❌ Don't leave test rows in the remote DB — say so and delete them (`DELETE /api/sets/:id`).
