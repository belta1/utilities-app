---
updated: 2026-09-25
covers: [pages, ui, react, hydration]
status: current
---

# Pages / UI (`pages/`)

One `.jsx` = one route. Served by [server](server.md), compiled by [jsx](jsx.md).

## Key files & entry points

- `pages/recomp_v3.jsx` — the live RECOMP dashboard, served at `/` (`HOME_PAGE`). Fetches
  its data from `/api/*`.
- `pages/recomp_v2.jsx` — the **frozen** original; hard-codes its own copy of everything.
- `pages/hello.jsx`, `pages/list.jsx` — small examples.
- `pages/_lib/recomp/{tokens,data,ui}.jsx` — private shared modules (design tokens; meal/macro
  content; shared tabs/ui). Importable, **never served** (any `_` path segment is private).

## Two kinds of page

- **Module page** — has `import`/`export`, `export default function Page(props)`. SSR'd with
  `renderToString`, then hydrated by `/<name>.js`. Hooks and handlers work. Every real UI is this.
- **Expression page** — bare JSX (`props`, `React` in scope). Static HTML, no client JS.

## How it works

- Route mapping and compilation live in [server](server.md)/[jsx](jsx.md); a page just exports
  a component (or is an expression).
- **Data flow:** no server-side data loading. Fetch from `/api/*` in `useEffect` after mount.
  Query-string params arrive as **string** props.
- **Styling:** inline styles + one `<style>` block per page (fonts `@import`, resets,
  keyframes). Shared values from `pages/_lib/recomp/tokens.jsx`. No CSS/image imports.

## Gotchas & constraints

- **SSR-safe render:** no `window`/`document`/`location`/`localStorage`/`Date`-based "today"/
  random during render — they cause hydration mismatches. Put them in `useEffect` (see `today`
  in `recomp_v3.jsx`).
- **Import boundary:** pages may import files under `pages/` and packages from `node_modules`
  only — **never** `seed/`, `api.mjs`, `db.mjs`. Pages are a leaf.
- **Everything a page imports ships to the browser** — keep heavy data in the API, not in `_lib`.
- Copy is **Spanish without accents** (`musculo`, `Nutricion`). Labels use the `// SECTION_NAME`
  mono style. House style tokens/fonts in [conventions](../conventions.md).
- **Dashboard content that is data lives in Postgres, not here** — plan, targets, measurements,
  figures. Editing those is an API call, not a page edit. See [architecture](../architecture.md).
- **"HOY sugerido"**: `recomp_v3.jsx`'s `useRecommendation(today)` fetches
  `/api/recommendation?date=today`; when present, the Training tab shows a `T.gold` banner and
  auto-opens the recommended plan day instead of the calendar weekday (the day strip still lets
  the user switch back). Written by the coach's `hoy` — see [coach](coach.md), [glossary](../glossary.md).

## Related

- [server](server.md), [jsx](jsx.md), [api](api.md), [conventions](../conventions.md)
