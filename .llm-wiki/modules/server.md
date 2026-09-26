---
updated: 2026-09-25
covers: [server, http, ssr, routing]
status: current
---

# Server (`server.mjs`)

The HTTP entry point: page routing, SSR + hydration, the API delegation, and the compile cache.

## Key files & entry points

- `server.mjs` — the whole server; `await migrate(); await seed();` then `server.listen(PORT)`.
- Depends on [jsx](jsx.md) (compile/bundle), [api](api.md) (`handleApi`), [db](db.md) (`migrate`, `seed`).

## Routes

- `GET /health` → `ok`.
- `POST /render` — compile a JSX string/body and return static HTML (`renderToStaticMarkup`).
- `GET /<name>` — read `pages/<name>.jsx`, compile, SSR → HTML document. Module pages also
  get `<script src="/<name>.js">` + a `#__props` JSON blob.
- `GET /<name>.js` — the browser hydration bundle for a module page (404 for expression pages).
- `GET /` → `HOME_PAGE` (env, default `recomp_v3`). **No index listing.**
- `/api/*` — handled first by `handleApi` (see [api](api.md)); returns before page routing.

## How it works

- **Routing → file:** `pageFile()` maps `/a/b` → `pages/a/b.jsx`, refuses paths that escape
  `PAGES_DIR` or contain a `_` segment (private modules). `isPrivate` blocks `pages/_lib/…`.
- **Module vs expression page:** `isModuleSource(src)` (has top-level `import`/`export`).
  Module pages → `renderToString` + a hydration bundle; expression pages → `renderToStaticMarkup`, static.
- **Cache:** `pagesStamp()` = newest mtime under `PAGES_DIR`; `cached(key, stamp, produce)`
  memoizes compiled SSR renderers (`ssr:<name>`) and bundles (`js:<name>`) against it. Any
  edit under `pages/` invalidates everything on the next request — no restart needed.
- **Document wrap:** `toDocument()` wraps a fragment in `<!doctype html>…` unless the page
  rendered its own `<html>`.

## Gotchas & constraints

- **`new URL(req.url, …)` is inside the request try** on purpose: it throws on targets the
  HTTP parser accepts but the URL spec rejects; an unhandled throw would kill the process.
- **`keepAliveTimeout = 65_000`, `headersTimeout = 66_000`** — deliberately above browser/
  proxy idle timeouts so a response is never written into a socket being closed (that shows
  in the browser as a bare "Failed to fetch"; POSTs aren't retried).
- **Props are strings.** Query-string params become string props; there's no server-side
  data loading — pages fetch from `/api/*` after mount.
- `MAX_BODY` = 1 MiB; oversized bodies → 413.
- Editing `server.mjs` itself needs a restart (only `pages/` is hot).

## Related

- [jsx](jsx.md), [api](api.md), [pages](pages.md), [architecture](../architecture.md)
